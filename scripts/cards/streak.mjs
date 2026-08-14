// Total contributions, current streak and longest streak — built from the same
// API data as everything else, so it does not depend on a third-party service.
import { card, esc, round, FONT, MUTED, DIM, FG, CYAN, BLUE, PURPLE, YELLOW, WIDTH } from '../lib/svg.mjs';

export const id = 'streak';

const H = 200;
const RING = 54;

const day = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const span = (range) => (range ? `${day(range.from)} — ${day(range.to)}` : 'not right now');

function panel(x, label, value, unit, sub, colour) {
  return `
  <text x="${x}" y="42" text-anchor="middle" font-family="${FONT}" font-size="12" font-weight="700" fill="${MUTED}" letter-spacing="2">${esc(label)}</text>
  <text x="${x}" y="104" text-anchor="middle" font-family="${FONT}" font-size="42" font-weight="800" fill="${colour}">${esc(value)}</text>
  <text x="${x}" y="128" text-anchor="middle" font-family="${FONT}" font-size="12" font-weight="700" fill="${FG}" letter-spacing="1.5">${esc(unit)}</text>
  <text x="${x}" y="160" text-anchor="middle" font-family="${FONT}" font-size="12" font-weight="600" fill="${MUTED}">${esc(sub)}</text>`;
}

export default function streak(p) {
  const third = WIDTH / 3;
  const mid = round(third * 1.5);

  const defs = `
    <filter id="sglow" x="-70%" y="-70%" width="240%" height="240%">
      <feGaussianBlur stdDeviation="5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="flame" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="${YELLOW}"/>
      <stop offset="1" stop-color="#ff7a5c"/>
    </linearGradient>`;

  // The ring rests fully drawn; only the glow pulses, so a still frame still reads.
  const ring = `
  <g transform="translate(${mid} 98)">
    <circle r="${RING}" fill="none" stroke="${DIM}" stroke-opacity="0.35" stroke-width="6"/>
    <circle r="${RING}" fill="none" stroke="url(#flame)" stroke-width="6" stroke-linecap="round"
            stroke-dasharray="${round(2 * Math.PI * RING)}" transform="rotate(-90)" filter="url(#sglow)">
      <animate attributeName="stroke-opacity" values="0.75;1;0.75" dur="2.6s" repeatCount="indefinite"/>
    </circle>
  </g>`;

  const divider = (x) =>
    `<line x1="${x}" y1="38" x2="${x}" y2="${H - 28}" stroke="${DIM}" stroke-opacity="0.3" stroke-width="1"/>`;

  const body = `
  ${ring}
  ${divider(round(third))}
  ${divider(round(third * 2))}
  ${panel(round(third * 0.5), 'TOTAL CONTRIBUTIONS', p.total.toLocaleString('en-US'), 'THIS YEAR', `${day(p.days[0].date)} — ${day(p.days.at(-1).date)}`, BLUE)}
  ${panel(mid, 'CURRENT STREAK', String(p.current), p.current === 1 ? 'DAY' : 'DAYS', span(p.currentRange), YELLOW)}
  ${panel(round(third * 2.5), 'LONGEST STREAK', String(p.longest), p.longest === 1 ? 'DAY' : 'DAYS', span(p.longestRange), PURPLE)}`;

  return card({
    height: H,
    title: `${p.current}-day current streak, ${p.longest}-day longest`,
    label: `${p.total} contributions this year, a ${p.current}-day current streak and a ${p.longest}-day longest streak`,
    defs,
    body,
  });
}
