// A boot sequence that types itself out, using real numbers from the API.
import { card, esc, round, MONO, FONT, PANEL, MUTED, DIM, FG, CYAN, GREEN, PURPLE, YELLOW, RED, WIDTH } from '../lib/svg.mjs';
import { relativeTime } from '../lib/gh.mjs';

export const id = 'terminal';

const H = 250;
const X = 48;
const TOP = 80;
const LINE = 20;
const CYCLE = 14;

export default function terminal(p) {
  const top = p.languages[0];
  const recent = p.repos.find((r) => r.lastCommit) ?? p.repos[0];

  const lines = [
    { kind: 'cmd', text: 'whoami' },
    { kind: 'out', text: `${p.login} — full-stack developer, jack of too many trades`, fill: FG },
    { kind: 'cmd', text: 'cat contributions.log' },
    { kind: 'out', text: `${p.total.toLocaleString('en-US')} contributions · ${p.longest}-day longest streak · ${p.current}-day current`, fill: CYAN },
    { kind: 'out', text: top ? `primary language: ${top.name} across ${top.count} public repos` : 'primary language: unknown', fill: PURPLE },
    { kind: 'cmd', text: 'git log --oneline -1 --all' },
    {
      kind: 'out',
      text: recent?.lastCommit
        ? `${recent.name}: ${recent.lastCommit.slice(0, 68)} (${relativeTime(recent.lastCommitAt)})`
        : 'nothing pushed yet',
      fill: YELLOW,
    },
    { kind: 'cmd', text: 'status' },
    { kind: 'out', text: 'always building · always vibing ♪', fill: GREEN },
  ];

  const clips = [];
  const rows = [];
  const keyframes = [];

  lines.forEach((line, i) => {
    const y = TOP + i * LINE;
    const start = 0.5 + i * 1.2;
    const dur = 0.35 + line.text.length * 0.018;
    const a = round((start / CYCLE) * 100);
    const b = round(((start + dur) / CYCLE) * 100);

    keyframes.push(
      `@keyframes t${i}{0%,${a}%{transform:scaleX(0)}${b}%,93%{transform:scaleX(1)}93.5%,100%{transform:scaleX(0)}}` +
        `.ty${i}{transform-origin:${X}px 0;animation:t${i} ${CYCLE}s steps(${Math.max(6, Math.ceil(line.text.length / 1.5))},end) infinite}`
    );

    clips.push(`<clipPath id="tl${i}"><rect class="ty${i}" x="${X}" y="${y - 14}" width="${WIDTH - X - 40}" height="19"/></clipPath>`);

    const content =
      line.kind === 'cmd'
        ? `<tspan fill="${GREEN}">$ </tspan><tspan fill="${FG}">${esc(line.text)}</tspan>`
        : `<tspan fill="${line.fill}">${esc(line.text)}</tspan>`;

    rows.push(`<g clip-path="url(#tl${i})"><text x="${X}" y="${y}" font-family="${MONO}" font-size="13.5">${content}</text></g>`);
  });

  const lastY = TOP + (lines.length - 1) * LINE;
  const cursorShow = round(((0.5 + (lines.length - 1) * 1.2 + 1.2) / CYCLE) * 100);

  const style = `${keyframes.join('\n')}
.cursor{animation:cshow ${CYCLE}s steps(1,end) infinite}
@keyframes cshow{0%,${cursorShow}%{opacity:0}${round(cursorShow + 0.5)}%,93%{opacity:1}94%,100%{opacity:0}}
.blink{animation:blink 1.05s steps(1,end) infinite}
@keyframes blink{0%,50%{opacity:1}50.01%,100%{opacity:0}}`;

  const body = `
  <rect x="24" y="20" width="${WIDTH - 48}" height="${H - 44}" rx="10" fill="${PANEL}" stroke="${DIM}" stroke-opacity="0.6"/>
  <rect x="24" y="20" width="${WIDTH - 48}" height="34" rx="10" fill="${DIM}" fill-opacity="0.35"/>
  <rect x="24" y="46" width="${WIDTH - 48}" height="8" fill="${PANEL}"/>
  <circle cx="48" cy="37" r="5.5" fill="${RED}"/><circle cx="68" cy="37" r="5.5" fill="${YELLOW}"/><circle cx="88" cy="37" r="5.5" fill="${GREEN}"/>
  <text x="${WIDTH / 2}" y="42" text-anchor="middle" font-family="${FONT}" font-size="12" font-weight="600" fill="${MUTED}" letter-spacing="1.5">${esc(p.login)} — zsh</text>
  ${rows.join('')}
  <g class="cursor"><rect class="blink" x="${X}" y="${lastY - 11}" width="8" height="15" fill="${CYAN}"/></g>`;

  return card({
    height: H,
    title: 'A terminal booting up my profile',
    label: `A terminal window typing out live profile stats: ${p.total} contributions, ${p.longest}-day longest streak`,
    defs: clips.join(''),
    style,
    body,
  });
}
