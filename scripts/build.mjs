// Regenerates everything that changes on its own: today's animation, the
// time-of-day hero, the "currently building" list and the streak card.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fetchProfile, relativeTime } from './lib/gh.mjs';
import { dark } from './lib/theme.mjs';
import { readReadme, writeReadme, updateSection, bustCache } from './lib/readme.mjs';
import { FONT, MUTED } from './lib/svg.mjs';

import streakCard from './cards/streak.mjs';

// Namespace imports so each module's `id` travels with its render function.
import * as waveform from './anim/waveform.mjs';
import * as plane from './anim/plane.mjs';
import * as ekg from './anim/ekg.mjs';
import * as runner from './anim/runner.mjs';
import * as tetris from './anim/tetris.mjs';
import * as weather from './anim/weather.mjs';
import * as terminal from './anim/terminal.mjs';
import * as pendulum from './anim/pendulum.mjs';

const ROOT = new URL('../', import.meta.url).pathname;
const LOGIN = process.env.PROFILE_USER || 'rkhooda';
const TOKEN = process.env.GITHUB_TOKEN;
const TZ = process.env.PROFILE_TZ || 'Asia/Kolkata';

// One slot on the README, a different animation every day.
const ROTATION = [waveform, plane, ekg, runner, tetris, weather, terminal, pendulum];

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

// Sky gradients per phase — parchment tints for the light file, forest for the dark.
const NIGHT = { light: ['#e3d9c4', '#ebe1cb', '#f2eadb'], dark: ['#101014', '#15161a', '#1d1d24'] };
const PHASES = [
  { until: 5, name: 'night', label: 'coding at night', sky: NIGHT },
  { until: 8, name: 'dawn', label: 'up before the sun', sky: { light: ['#eedccb', '#f2e4d1', '#f7eee0'], dark: ['#1a151c', '#211a22', '#2e2430'] } },
  { until: 17, name: 'day', label: 'heads down', sky: { light: ['#ece2cb', '#f4e9cf', '#f6efe0'], dark: ['#131418', '#191a20', '#23242c'] } },
  { until: 21, name: 'dusk', label: 'golden hour', sky: { light: ['#eedbb8', '#f2e3c4', '#f6ecd6'], dark: ['#1c1614', '#241b19', '#332521'] } },
  { until: 24, name: 'night', label: 'coding at night', sky: NIGHT },
];

// Blocks the hero only shows in one theme (moon and stars vs the sun).
const only = (svg, theme) => svg.replace(/<!-- (dark|light)-only[^>]*-->[\s\S]*?<!-- \/\1-only -->/g, (block, t) => (t === theme ? block : ''));

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

  const badge = `<g font-family="${FONT}" font-size="12" font-weight="600" letter-spacing="1.5">
    <text x="1164" y="46" text-anchor="end" fill="${MUTED}">${parts} · ${phase.label}</text>
  </g>`;
  const svg = readFileSync(src, 'utf8').replace(/<\/svg>\s*$/, `${badge}\n</svg>\n`);

  for (const theme of ['light', 'dark']) {
    const themed = theme === 'dark' ? dark(only(svg, 'dark')) : only(svg, 'light');
    if (!/<linearGradient id="sky"/.test(themed)) console.warn('hero: sky gradient not found, palette left alone');
    const swapped = themed.replace(/<linearGradient id="sky"[\s\S]*?<\/linearGradient>/, (block) => {
      let i = 0;
      return block.replace(/stop-color="#[0-9a-fA-F]{3,8}"/g, () => `stop-color="${phase.sky[theme][i++] ?? phase.sky[theme].at(-1)}"`);
    });
    writeFileSync(`${ROOT}assets/hero-now${theme === 'dark' ? '-dark' : ''}.svg`, swapped);
  }
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

// ----------------------------------------------------------------------- main

if (!TOKEN) throw new Error('GITHUB_TOKEN is required');

const profile = await fetchProfile(LOGIN, TOKEN);
const anim = todaysAnimation();

/** Every generated card is written twice: the light file and its dark twin. */
function writePair(name, svg) {
  writeFileSync(`${ROOT}assets/${name}.svg`, svg);
  writeFileSync(`${ROOT}assets/${name}-dark.svg`, dark(svg));
}

mkdirSync(`${ROOT}assets/anim`, { recursive: true });
writePair('anim/today', anim.default(profile));

const phase = writeHero();

writePair('streak', streakCard(profile));

let md = readReadme();
md = updateSection(md, 'building', buildingSection(profile));
md = bustCache(md, ['anim/today', 'hero-now', 'streak'].flatMap((n) => [`assets/${n}.svg`, `assets/${n}-dark.svg`]));
writeReadme(md);

console.log(
  `animation=${anim.id} hero=${phase?.name ?? 'skipped'} contributions=${profile.total}`
);
