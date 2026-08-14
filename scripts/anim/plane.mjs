// A jet strafes the contribution grid; every cell it hits drops and piles up at the floor.
import { card, caption, round, FONT, MUTED, DIM, CYAN, RED, YELLOW, LEVELS, WIDTH } from '../lib/svg.mjs';

export const id = 'plane';

const H = 270;
const STEP = 20;
const CELL = 16;
const ROWS = 7;
// The jet is drawn around its own origin and is ~28px tall, so it needs real
// headroom above the grid or its top half falls outside the canvas.
const PLANE_Y = 46;
const GRID_Y = 68;
// The debris floor sits below the grid so that even a fully-active week — where
// the pile would otherwise equal the original column — visibly collapses.
const DROP = 28;
const CYCLE = 15;

// Flight: plane is at x = -70 at FLY_IN and x = 1290 at FLY_OUT (fractions of CYCLE).
const FLY_IN = 0.03;
const FLY_OUT = 0.45;

export default function plane(p) {
  const cols = p.weeks.length;
  const gridW = cols * STEP - (STEP - CELL);
  const x0 = round((WIDTH - gridW) / 2);
  const restRow = GRID_Y + (ROWS - 1) * STEP + DROP; // y of the bottom-most piled cell
  const floor = restRow + CELL;

  const cells = [];
  const keyframes = [];

  for (let c = 0; c < cols; c++) {
    const week = p.weeks[c];
    const lit = week.map((d, r) => ({ d, r })).filter(({ d }) => d.level > 0);
    const x = round(x0 + c * STEP);

    // The beam reaches this column's centre at t seconds into the cycle.
    const planeX = 80 + STEP * c;
    const t = CYCLE * FLY_IN + ((planeX + 70) / 1360) * CYCLE * (FLY_OUT - FLY_IN);
    const p1 = round((t / CYCLE) * 100);
    const p2 = round(((t + 0.85) / CYCLE) * 100);

    keyframes.push(
      `@keyframes f${c}{0%,${p1}%{transform:translateY(0);opacity:1;animation-timing-function:cubic-bezier(.5,0,1,1)}` +
        `${p2}%,84%{transform:translateY(var(--dy));opacity:1}` +
        `90%{transform:translateY(var(--dy));opacity:0}` +
        `91%{transform:translateY(0);opacity:0}100%{transform:translateY(0);opacity:1}}`
    );

    week.forEach((day, r) => {
      const y = GRID_Y + r * STEP;
      if (day.level === 0) {
        cells.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3" fill="${LEVELS[0]}"/>`);
        return;
      }
      // Wreckage stacks up from the floor, keeping its order within the week, so
      // each column's pile height is that week's active-day count.
      const k = lit.findIndex((l) => l.r === r);
      const dy = restRow - (lit.length - 1 - k) * STEP - y;
      cells.push(
        `<rect class="b c${c}" style="--dy:${dy}px" x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3" fill="${LEVELS[day.level]}"/>`
      );
    });
  }

  const style = `.b{animation-duration:${CYCLE}s;animation-iteration-count:infinite}
${p.weeks.map((_, c) => `.c${c}{animation-name:f${c}}`).join('')}
.plane{animation:fly ${CYCLE}s linear infinite}
@keyframes fly{0%{transform:translate(-90px,0);opacity:0}${FLY_IN * 100}%{transform:translate(-70px,0);opacity:1}${FLY_OUT * 100}%{transform:translate(1290px,0);opacity:1}48%{transform:translate(1330px,0);opacity:0}100%{transform:translate(1330px,0);opacity:0}}
${keyframes.join('\n')}`;

  const defs = `
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${CYAN}" stop-opacity="0.38"/>
      <stop offset="0.55" stop-color="${CYAN}" stop-opacity="0.12"/>
      <stop offset="1" stop-color="${CYAN}" stop-opacity="0"/>
    </linearGradient>
    <filter id="pglow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`;

  const body = `
  <g>${cells.join('')}</g>
  <line x1="${x0 - 6}" y1="${floor + 5}" x2="${round(x0 + gridW + 6)}" y2="${floor + 5}" stroke="${DIM}" stroke-width="2" stroke-linecap="round"/>
  <g class="plane">
    <rect x="-1" y="${PLANE_Y + 16}" width="2" height="${floor - PLANE_Y - 16}" fill="url(#beam)"/>
    <ellipse cx="0" cy="${floor - 6}" rx="14" ry="6" fill="${YELLOW}" opacity="0.22" filter="url(#pglow)"/>
    <g transform="translate(0 ${PLANE_Y})" filter="url(#pglow)">
      <path d="M22,0 L-8,-9 L-2,0 L-8,9 Z" fill="${CYAN}"/>
      <path d="M-4,-3 L-20,-14 L-14,-2 Z" fill="#4d7fc4"/>
      <path d="M-4,3 L-20,14 L-14,2 Z" fill="#4d7fc4"/>
      <path d="M-14,0 L-26,-4 L-26,4 Z" fill="${RED}" opacity="0.9"/>
    </g>
  </g>
  <text x="24" y="30" font-family="${FONT}" font-size="13" font-weight="700" fill="${CYAN}" letter-spacing="2">INCOMING</text>
  ${caption(`${p.total.toLocaleString('en-US')} CONTRIBUTIONS  ·  ${p.weeks.length} WEEKS  ·  NO SURVIVORS`, H)}`;

  return card({
    height: H,
    title: 'A plane strafes my contribution graph and the squares fall into a pile',
    label: 'A jet flies across the contribution graph shooting the squares, which fall and stack up at the bottom',
    defs,
    style,
    body,
  });
}
