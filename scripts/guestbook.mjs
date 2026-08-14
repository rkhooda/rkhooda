// Renders everyone who commented on the guestbook issue as a wall of avatars.
// Avatars only — no visitor-supplied text ever reaches the profile.
import { mkdirSync, writeFileSync } from 'node:fs';
import { rest } from './lib/gh.mjs';
import { readReadme, writeReadme, bustCache } from './lib/readme.mjs';
import { card, caption, esc, round, FONT, MUTED, DIM, FG, CYAN, BLUE, PURPLE, GREEN, YELLOW, RED, WIDTH } from './lib/svg.mjs';

const ROOT = new URL('../', import.meta.url).pathname;
const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY;
const LABEL = process.env.GUESTBOOK_LABEL || 'guestbook';
const OWNER = REPO?.split('/')[0];

const SIZE = 46;
const GAP = 14;
const PER_ROW = 19;
const CAP = PER_ROW * 3;
const RING = [CYAN, PURPLE, BLUE, GREEN, YELLOW, RED];

async function guestbookIssue() {
  const issues = await rest(`/repos/${REPO}/issues?labels=${encodeURIComponent(LABEL)}&state=open&per_page=1`, TOKEN);
  return issues[0] ?? null;
}

async function allComments(number) {
  const out = [];
  for (let page = 1; page <= 20; page++) {
    const batch = await rest(`/repos/${REPO}/issues/${number}/comments?per_page=100&page=${page}`, TOKEN);
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}

/** Latest comment per human visitor, most recent first. */
function signers(comments) {
  const seen = new Map();
  for (const c of comments) {
    if (!c.user || c.user.type === 'Bot' || c.user.login === OWNER) continue;
    seen.set(c.user.login, { login: c.user.login, id: c.user.id, at: c.created_at });
  }
  return [...seen.values()].sort((a, b) => new Date(b.at) - new Date(a.at));
}

async function avatar(person) {
  try {
    const res = await fetch(`https://avatars.githubusercontent.com/u/${person.id}?v=4&s=${SIZE * 2}`);
    if (!res.ok) throw new Error(String(res.status));
    const type = res.headers.get('content-type') ?? 'image/png';
    const b64 = Buffer.from(await res.arrayBuffer()).toString('base64');
    return `data:${type};base64,${b64}`;
  } catch {
    return null; // fall back to initials rather than dropping the person
  }
}

export function wall(people, images, total) {
  const rows = Math.max(1, Math.ceil(people.length / PER_ROW));
  const H = 74 + rows * (SIZE + GAP) + 30;
  const gridW = Math.min(people.length, PER_ROW) * (SIZE + GAP) - GAP;
  const x0 = round((WIDTH - gridW) / 2);

  if (!people.length) {
    return card({
      height: 150,
      title: 'Nobody has signed the guestbook yet',
      label: 'The guestbook is empty',
      body: `<text x="24" y="30" font-family="${FONT}" font-size="13" font-weight="700" fill="${CYAN}" letter-spacing="2">GUESTBOOK</text>
  <text x="${WIDTH / 2}" y="86" text-anchor="middle" font-family="${FONT}" font-size="17" fill="${FG}">nobody has signed yet — you could be the first</text>
  ${caption('COMMENT ON THE GUESTBOOK ISSUE AND YOUR FACE APPEARS HERE', 150)}`,
    });
  }

  const faces = people
    .map((person, i) => {
      const cx = round(x0 + (i % PER_ROW) * (SIZE + GAP) + SIZE / 2);
      const cy = round(74 + Math.floor(i / PER_ROW) * (SIZE + GAP) + SIZE / 2);
      const begin = round(i * 0.035);
      const ring = RING[i % RING.length];
      const inner = images[i]
        ? `<image x="${-SIZE / 2}" y="${-SIZE / 2}" width="${SIZE}" height="${SIZE}" clip-path="url(#face)" href="${images[i]}" preserveAspectRatio="xMidYMid slice"/>`
        : `<circle r="${SIZE / 2}" fill="${ring}" fill-opacity="0.25"/>
           <text y="6" text-anchor="middle" font-family="${FONT}" font-size="18" font-weight="700" fill="${ring}">${esc(person.login[0].toUpperCase())}</text>`;

      return `<g transform="translate(${cx} ${cy})">
    <g opacity="0">
      <animateTransform attributeName="transform" type="scale" values="0.3;1.1;1" keyTimes="0;0.72;1" dur="0.5s" begin="${begin}s" fill="freeze" repeatCount="1"/>
      <animate attributeName="opacity" values="0;1" dur="0.35s" begin="${begin}s" fill="freeze" repeatCount="1"/>
      ${inner}
      <circle r="${SIZE / 2}" fill="none" stroke="${ring}" stroke-opacity="0.7" stroke-width="2"/>
      <title>${esc(person.login)}</title>
    </g>
  </g>`;
    })
    .join('');

  const shown = people.length < total ? `SHOWING THE ${people.length} MOST RECENT` : 'EVERY ONE OF THEM';

  return card({
    height: H,
    title: `${total} ${total === 1 ? 'person has' : 'people have'} signed my guestbook`,
    label: `A wall of ${people.length} GitHub avatars from visitors who signed the guestbook`,
    defs: `<clipPath id="face"><circle r="${SIZE / 2 - 1}"/></clipPath>`,
    body: `<text x="24" y="30" font-family="${FONT}" font-size="13" font-weight="700" fill="${CYAN}" letter-spacing="2">GUESTBOOK</text>
  <text x="${WIDTH - 24}" y="30" text-anchor="end" font-family="${FONT}" font-size="13" font-weight="600" fill="${MUTED}" letter-spacing="1">LATEST: @${esc(people[0].login)}</text>
  <text x="24" y="52" font-family="${FONT}" font-size="15" font-weight="600" fill="${FG}">${total} ${total === 1 ? 'person' : 'people'} said hi</text>
  ${faces}
  ${caption(shown, H)}`,
  });
}

// ----------------------------------------------------------------------- main
// Imported by build.mjs for the empty wall, so only act when run directly.

if (process.argv[1] === import.meta.filename) {
  if (!TOKEN || !REPO) throw new Error('GITHUB_TOKEN and GITHUB_REPOSITORY are required');

  const issue = await guestbookIssue();
  if (!issue) {
    console.log(`no open issue labelled "${LABEL}" — run scripts/setup.mjs first`);
  } else {
    const people = signers(await allComments(issue.number));
    const shown = people.slice(0, CAP);
    const images = await Promise.all(shown.map(avatar));

    mkdirSync(`${ROOT}assets`, { recursive: true });
    writeFileSync(`${ROOT}assets/guestbook.svg`, wall(shown, images, people.length));
    writeReadme(bustCache(readReadme(), ['assets/guestbook.svg']));

    console.log(`guestbook: ${people.length} signers, ${shown.length} shown, ${images.filter(Boolean).length} avatars embedded`);
  }
}
