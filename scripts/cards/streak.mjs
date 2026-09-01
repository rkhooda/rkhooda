// Total contributions, current streak and longest streak — built from the same
// API data as everything else, so it does not depend on a third-party service.
//
// The year is drawn as one bar per day. A streak is an unbroken stretch of that
// skyline, so the two streaks are shown *where they happened* rather than as
// numbers floating in boxes.
import { card, esc, round, scale, FONT, FG, MUTED, DIM, CYAN, PURPLE, YELLOW, WIDTH } from '../lib/svg.mjs';

export const id = 'streak';

const H = 222;
const PAD = 28;
const BASE = 180; // the skyline's ground line
const TALLEST = 44;
const STUB = 2; // a rest day still leaves a mark, so the axis never breaks

const day = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const month = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });

const span = (r) => `${day(r.from)} — ${day(r.to)}`;

function stat(x, anchor, value, unit, sub, colour) {
  return `
  <text x="${x}" y="88" text-anchor="${anchor}" font-family="${FONT}" fill="${colour}"><tspan font-size="44" font-weight="800">${esc(value)}</tspan><tspan font-size="15" font-weight="600" fill="${MUTED}" dx="7">${esc(unit)}</tspan></text>
  <text x="${x}" y="110" text-anchor="${anchor}" font-family="${FONT}" font-size="13" font-weight="600" fill="${MUTED}">${esc(sub)}</text>`;
}

export default function streak(p) {
  const days = p.days;
  const pitch = (WIDTH - 2 * PAD) / days.length;
  const tick = round(Math.max(1.4, pitch - 0.9));
  const x = (i) => round(PAD + i * pitch);
  const height = scale(days.map((d) => d.count));

  const index = new Map(days.map((d, i) => [d.date, i]));
  const range = (r) => (r ? [index.get(r.from), index.get(r.to)] : null);
  const cur = range(p.currentRange);
  const lon = range(p.longestRange);
  const sameRun = cur && lon && cur[0] === lon[0];
  const inside = (r, i) => r && i >= r[0] && i <= r[1];

  // One path per colour instead of one rect per day keeps the file small.
  const bars = { stub: [], base: [], cur: [], lon: [] };
  days.forEach((d, i) => {
    if (d.count === 0) return bars.stub.push(`M${x(i)} ${BASE}h${tick}v-${STUB}h-${tick}z`);
    const h = round(4 + height(d.count) * TALLEST);
    const bucket = inside(cur, i) ? 'cur' : inside(lon, i) ? 'lon' : 'base';
    bars[bucket].push(`M${x(i)} ${BASE}h${tick}v-${h}h-${tick}z`);
  });
  const path = (d, fill, extra = '') => (d.length ? `<path d="${d.join('')}" fill="${fill}" ${extra}/>` : '');

  const band = (r, colour) => {
    if (!r) return '';
    const x0 = x(r[0]) - 3;
    const w = round(x(r[1]) + tick + 3 - x0);
    return `<rect x="${x0}" y="${BASE - TALLEST - 10}" width="${w}" height="${TALLEST + 16}" rx="5" fill="${colour}" fill-opacity="0.09" stroke="${colour}" stroke-opacity="0.35">
      <animate attributeName="fill-opacity" values="0.07;0.14;0.07" dur="3.4s" repeatCount="indefinite"/>
    </rect>`;
  };

  const months = days
    .map((d, i) => [d, i])
    .filter(([d, i]) => d.date.endsWith('-01') && x(i) < WIDTH - PAD - 40)
    .map(([d, i]) => {
      const label = d.date.endsWith('-01-01') ? `${month(d.date)} ’${d.date.slice(2, 4)}` : month(d.date);
      return `<text x="${x(i)}" y="${BASE + 20}" font-family="${FONT}" font-size="11" font-weight="700" fill="${MUTED}" letter-spacing="1.5">${esc(label.toUpperCase())}</text>`;
    })
    .join('');

  const longestColour = sameRun ? YELLOW : PURPLE;
  const currentSub = p.current ? `since ${day(p.currentRange.from)}` : 'not right now';
  const longestSub = sameRun ? 'that’s this one — still going' : p.longest ? span(p.longestRange) : '—';

  // The skyline rests fully drawn; the reveal only happens where animation runs.
  const defs = `<clipPath id="reveal"><rect x="0" y="0" width="${WIDTH}" height="${H}">
      <animate attributeName="width" values="0;${WIDTH}" dur="1.6s" fill="freeze" calcMode="spline" keySplines="0.2 0 0 1" keyTimes="0;1"/>
    </rect></clipPath>`;

  const body = `
  <text x="${PAD}" y="34" font-family="${FONT}" font-size="13" font-weight="700" fill="${CYAN}" letter-spacing="2">THE LAST 12 MONTHS</text>
  <text x="${WIDTH - PAD}" y="34" text-anchor="end" font-family="${FONT}" font-size="13" font-weight="600" fill="${MUTED}" letter-spacing="1">ONE BAR PER DAY · GAPS ARE REST DAYS</text>
  ${stat(PAD, 'start', p.total.toLocaleString('en-US'), 'contributions', `${day(days[0].date)} — ${day(days.at(-1).date)}`, FG)}
  ${stat(WIDTH / 2, 'middle', String(p.current), 'day streak', currentSub, YELLOW)}
  ${stat(WIDTH - PAD, 'end', String(p.longest), 'day best', longestSub, longestColour)}
  <line x1="${PAD}" y1="${BASE + 0.5}" x2="${WIDTH - PAD}" y2="${BASE + 0.5}" stroke="${DIM}" stroke-opacity="0.5"/>
  ${sameRun ? band(cur, YELLOW) : band(lon, PURPLE) + band(cur, YELLOW)}
  <g clip-path="url(#reveal)">
    ${path(bars.stub, DIM, 'fill-opacity="0.6"')}
    ${path(bars.base, FG, 'fill-opacity="0.55"')}
    ${path(bars.lon, PURPLE)}
    ${path(bars.cur, YELLOW)}
  </g>
  ${months}`;

  return card({
    height: H,
    title: `${p.total} contributions in the last year — ${p.current}-day streak, ${p.longest}-day best`,
    label: `${p.total} contributions over the last 12 months drawn as one bar per day, a ${p.current}-day current streak and a ${p.longest}-day longest streak`,
    defs,
    body,
  });
}
