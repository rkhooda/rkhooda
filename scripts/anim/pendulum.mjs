// A pendulum wave: every week hangs from a rail as a string of seven day-beads.
// Each column swings at its own period, so the grid drifts into travelling
// waves, then chaos, and snaps back into the calendar twice a cycle.
import { card, caption, round, scale, FONT, MUTED, DIM, CYAN, LEVELS, WIDTH } from '../lib/svg.mjs';

export const id = 'pendulum';

const H = 250;
const STEP = 20;
const CELL = 16;
const ROWS = 7;
const RAIL = 56;
const TOP = 70;
// Week c completes N0 + c swings per cycle, one more than its neighbour: that
// integer spacing is what makes the columns drift apart and re-align, and it
// means every column is back at rest at CYCLE / 2 and CYCLE. Periods run from
// CYCLE / N0 (first week) down to CYCLE / (N0 + 52): slow enough to read as a
// lazy swing, close enough that the wave takes a full minute to dissolve.
export const CYCLE = 120;
const N0 = 56;
// Swing amplitude in degrees. Quiet weeks hang still. The spread is kept
// narrow: neighbours 3° apart stay parallel while in phase, a wider spread
// makes a busy week cross its quiet neighbour and tangles the wave.
const MIN_A = 8;
const MAX_A = 11;
// Sine motion out of four eased quarter-swings (ease-out to the peak, ease-in back).
const OUT = '0.39 0.575 0.565 1';
const IN = '0.47 0 0.745 0.715';

export default function pendulum(p) {
  const cols = p.weeks.length;
  const gridW = cols * STEP - (STEP - CELL);
  const x0 = round((WIDTH - gridW) / 2);
  const weekly = p.weeks.map((w) => w.reduce((s, d) => s + d.count, 0));
  const norm = scale(weekly);
  const bottom = TOP + (ROWS - 1) * STEP + CELL / 2;

  const columns = p.weeks.map((week, c) => {
    const x = round(x0 + c * STEP);
    const cx = x + CELL / 2;
    const a = weekly[c] ? round(MIN_A + (MAX_A - MIN_A) * norm(weekly[c])) : 0;
    const at = (deg) => `${deg} ${cx} ${RAIL}`;
    const swing = a
      ? `<animateTransform attributeName="transform" type="rotate" values="${at(0)};${at(a)};${at(0)};${at(-a)};${at(0)}" keyTimes="0;0.25;0.5;0.75;1" calcMode="spline" keySplines="${OUT};${IN};${OUT};${IN}" dur="${(CYCLE / (N0 + c)).toFixed(5)}s" repeatCount="indefinite"/>`
      : '';
    const beads = week
      .map((day, r) => `<rect x="${x}" y="${TOP + r * STEP}" width="${CELL}" height="${CELL}" rx="3" fill="${LEVELS[day.level]}"/>`)
      .join('');
    return `<g>${swing}<line x1="${cx}" y1="${RAIL}" x2="${cx}" y2="${bottom}" stroke="${DIM}" stroke-width="1.5"/>${beads}</g>`;
  });

  const pivots = p.weeks.map((_, c) => `<circle cx="${round(x0 + c * STEP + CELL / 2)}" cy="${RAIL}" r="2" fill="${MUTED}"/>`).join('');
  const peak = Math.max(...weekly);

  const body = `
  <line x1="${x0 - 10}" y1="${RAIL}" x2="${round(x0 + gridW + 10)}" y2="${RAIL}" stroke="${DIM}" stroke-width="2" stroke-linecap="round"/>
  ${columns.join('')}
  ${pivots}
  <text x="24" y="30" font-family="${FONT}" font-size="13" font-weight="700" fill="${CYAN}" letter-spacing="2">PENDULUM WAVE</text>
  <text x="${WIDTH - 24}" y="30" text-anchor="end" font-family="${FONT}" font-size="13" font-weight="600" fill="${MUTED}" letter-spacing="1">${cols} WEEKS  ·  ORDER RETURNS EVERY ${CYCLE / 2}s</text>
  ${caption(`BUSY WEEKS SWING WIDE  ·  QUIET WEEKS HANG STILL  ·  WIDEST SWING ${peak} CONTRIBUTIONS IN ONE WEEK`, H)}`;

  return card({
    height: H,
    title: 'My contribution graph swinging as a pendulum wave',
    label: `Each week of the contribution graph hangs as a pendulum and swings at its own period; busy weeks swing wide, the pattern drifts into waves and snaps back into the calendar every ${CYCLE / 2} seconds`,
    body,
  });
}
