// Regenerates everything that changes on its own: today's animation, the
// time-of-day hero, the "currently building" list and the WakaTime card.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fetchProfile, relativeTime } from './lib/gh.mjs';
import { readReadme, writeReadme, updateSection, bustCache } from './lib/readme.mjs';
import { card, caption, esc, round, FONT, MUTED, DIM, FG, CYAN, BLUE, PURPLE, GREEN, YELLOW, RED, WIDTH } from './lib/svg.mjs';

import streakCard from './cards/streak.mjs';

// Namespace imports so each module's `id` travels with its render function.
import * as waveform from './anim/waveform.mjs';
import * as plane from './anim/plane.mjs';
import * as ekg from './anim/ekg.mjs';
import * as runner from './anim/runner.mjs';
import * as tetris from './anim/tetris.mjs';
import * as weather from './anim/weather.mjs';
import * as terminal from './anim/terminal.mjs';

const ROOT = new URL('../', import.meta.url).pathname;
const LOGIN = process.env.PROFILE_USER || 'rkhooda';
const TOKEN = process.env.GITHUB_TOKEN;
const TZ = process.env.PROFILE_TZ || 'Asia/Kolkata';

// One slot on the README, a different animation every day.
const ROTATION = [waveform, plane, ekg, runner, tetris, weather, terminal];

function todaysAnimation() {
  if (process.env.ANIM) {
    const pick = ROTATION.find((a) => a.id === process.env.ANIM);
    if (!pick) throw new Error(`unknown ANIM "${process.env.ANIM}" — try ${ROTATION.map((a) => a.id).join(', ')}`);
    return pick;
  }
  const now = new Date();
  const doy = Math.floor((now - Date.UTC(now.getUTCFullYear(), 0, 0)) / 86400000);
  return ROTATION[doy % ROTATION.length];
}

// ---------------------------------------------------------------- hero palette

const PHASES = [
  { until: 5, name: 'night', label: 'coding at night', sky: ['#14141b', '#1a1b26', '#1e2233'] },
  { until: 8, name: 'dawn', label: 'up before the sun', sky: ['#241b2e', '#2b2038', '#3d2b48'] },
  { until: 17, name: 'day', label: 'heads down', sky: ['#1a2130', '#1f2a3d', '#28374f'] },
  { until: 21, name: 'dusk', label: 'golden hour', sky: ['#2b1c2a', '#32202f', '#45293c'] },
  { until: 24, name: 'night', label: 'coding at night', sky: ['#14141b', '#1a1b26', '#1e2233'] },
];

function writeHero() {
  const src = `${ROOT}assets/hero.svg`;
  if (!existsSync(src)) return null;

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
  const hour = Number(parts.slice(0, 2));
  const phase = PHASES.find((p) => hour < p.until);

  let svg = readFileSync(src, 'utf8');
  const swapped = svg.replace(/<linearGradient id="sky"[\s\S]*?<\/linearGradient>/, (block) => {
    let i = 0;
    return block.replace(/stop-color="#[0-9a-fA-F]{3,8}"/g, () => `stop-color="${phase.sky[i++] ?? phase.sky.at(-1)}"`);
  });
  if (swapped === svg) console.warn('hero: sky gradient not found, palette left alone');

  const badge = `<g font-family="${FONT}" font-size="12" font-weight="600" letter-spacing="1.5">
    <text x="1164" y="46" text-anchor="end" fill="${MUTED}">${parts} · ${phase.label}</text>
  </g>`;

  writeFileSync(`${ROOT}assets/hero-now.svg`, swapped.replace(/<\/svg>\s*$/, `${badge}\n</svg>\n`));
  return phase;
}

// ------------------------------------------------------------ currently building

function buildingSection(profile) {
  const rows = profile.repos
    // The profile repo itself only ever shows this workflow's own bot commits.
    .filter((r) => r.lastCommit && r.name !== profile.login)
    .slice(0, 5)
    .map((r) => {
      const lang = r.language ? ` \`${r.language}\`` : '';
      return `- **[${r.name}](${r.url})**${lang} — ${r.lastCommit.replace(/[|`]/g, '')} · _${relativeTime(r.lastCommitAt)}_`;
    });
  return rows.length ? rows.join('\n') : '_nothing pushed publicly yet._';
}

// ------------------------------------------------------------------- wakatime

const WAKA_COLORS = [CYAN, PURPLE, BLUE, GREEN, YELLOW, RED];

async function fetchWaka(key) {
  const res = await fetch('https://wakatime.com/api/v1/users/current/stats/last_7_days', {
    headers: { Authorization: `Basic ${Buffer.from(key).toString('base64')}` },
  });
  if (!res.ok) throw new Error(`wakatime ${res.status}`);
  return (await res.json()).data;
}

function wakaCard(data) {
  const H = 60 + 6 * 32 + 34;
  if (!data || !data.languages?.length) {
    return card({
      height: 150,
      title: 'WakaTime is still warming up',
      label: 'WakaTime coding stats are not available yet',
      body: `<text x="24" y="30" font-family="${FONT}" font-size="13" font-weight="700" fill="${CYAN}" letter-spacing="2">LAST 7 DAYS</text>
  <text x="${WIDTH / 2}" y="82" text-anchor="middle" font-family="${FONT}" font-size="16" fill="${FG}">still warming up — WakaTime starts counting once the editor plugin is installed</text>
  ${caption('THIS CARD FILLS IN ON ITS OWN', 150)}`,
    });
  }

  const langs = data.languages.filter((l) => l.percent > 0).slice(0, 6);
  const maxPct = Math.max(...langs.map((l) => l.percent));
  const barX = 190;
  const barW = WIDTH - barX - 150;

  const rows = langs
    .map((l, i) => {
      const y = 62 + i * 32;
      const w = round((l.percent / maxPct) * barW);
      return `<text x="24" y="${y + 13}" font-family="${FONT}" font-size="14" font-weight="600" fill="${FG}">${esc(l.name)}</text>
    <rect x="${barX}" y="${y}" width="${barW}" height="18" rx="9" fill="${DIM}" fill-opacity="0.3"/>
    <rect x="${barX}" y="${y}" width="${w}" height="18" rx="9" fill="${WAKA_COLORS[i % WAKA_COLORS.length]}">
      <animate attributeName="width" values="0;${w}" dur="0.9s" begin="${round(i * 0.1)}s" fill="freeze" calcMode="spline" keySplines="0.2 0 0 1" keyTimes="0;1"/>
    </rect>
    <text x="${WIDTH - 24}" y="${y + 13}" text-anchor="end" font-family="${FONT}" font-size="13" font-weight="600" fill="${MUTED}">${esc(l.text)}</text>`;
    })
    .join('');

  return card({
    height: H,
    title: `Where my last 7 days of coding went — ${data.human_readable_total}`,
    label: `WakaTime breakdown of the last 7 days: ${langs.map((l) => `${l.name} ${l.text}`).join(', ')}`,
    body: `<text x="24" y="30" font-family="${FONT}" font-size="13" font-weight="700" fill="${CYAN}" letter-spacing="2">LAST 7 DAYS</text>
  <text x="${WIDTH - 24}" y="30" text-anchor="end" font-family="${FONT}" font-size="13" font-weight="600" fill="${MUTED}" letter-spacing="1">${esc(data.human_readable_total ?? '')} TRACKED</text>
  ${rows}
  ${caption('MEASURED BY WAKATIME, NOT BY VIBES', H)}`,
  });
}

// ----------------------------------------------------------------------- main

if (!TOKEN) throw new Error('GITHUB_TOKEN is required');

const profile = await fetchProfile(LOGIN, TOKEN);
const anim = todaysAnimation();

mkdirSync(`${ROOT}assets/anim`, { recursive: true });
writeFileSync(`${ROOT}assets/anim/today.svg`, anim.default(profile));

const phase = writeHero();

let waka = null;
if (process.env.WAKATIME_API_KEY) {
  try {
    waka = await fetchWaka(process.env.WAKATIME_API_KEY);
  } catch (err) {
    console.warn(`wakatime: ${err.message} — writing the placeholder card`);
  }
}
writeFileSync(`${ROOT}assets/wakatime.svg`, wakaCard(waka));
writeFileSync(`${ROOT}assets/streak.svg`, streakCard(profile));

let md = readReadme();
md = updateSection(md, 'building', buildingSection(profile));
md = bustCache(md, ['assets/anim/today.svg', 'assets/hero-now.svg', 'assets/wakatime.svg', 'assets/streak.svg']);
writeReadme(md);

console.log(
  `animation=${anim.id} hero=${phase?.name ?? 'skipped'} waka=${waka ? 'live' : 'placeholder'} contributions=${profile.total}`
);
