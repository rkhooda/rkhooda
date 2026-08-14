// 53 weeks stacked in a well; the blocks drop in, then the bottom row clears.
import { card, caption, round, scale, FONT, MUTED, DIM, CYAN, PURPLE, BLUE, GREEN, YELLOW, RED, WIDTH } from '../lib/svg.mjs';

export const id = 'tetris';

const H = 250;
const COL = 20;
const CELL = 17;
const ROWS = 12;
const ROW_H = 14;
const TOP = 42;
const CYCLE = 14;

const PIECES = [CYAN, PURPLE, BLUE, GREEN, YELLOW, RED, '#ff9e64'];

export default function tetris(p) {
  const weekly = p.weeks.map((w) => w.reduce((s, d) => s + d.count, 0));
  const norm = scale(weekly, 0.9, 0.7);
  const peak = Math.max(1, ...weekly);
  const cols = weekly.length;
  const gridW = cols * COL - (COL - CELL);
  const x0 = round((WIDTH - gridW) / 2);
  const floor = TOP + ROWS * ROW_H;

  const blocks = [];
  const keyframes = [];

  weekly.forEach((total, c) => {
    const height = total === 0 ? 0 : Math.max(1, Math.round(norm(total) * ROWS));
    const x = round(x0 + c * COL);
    const start = 0.35 + c * (4.6 / cols);
    const p1 = round((start / CYCLE) * 100);
    const p2 = round(((start + 0.6) / CYCLE) * 100);

    keyframes.push(
      `@keyframes d${c}{0%,${p1}%{transform:translateY(var(--from));opacity:0;animation-timing-function:cubic-bezier(.45,0,1,1)}` +
        `${round(p1 + 0.5)}%{opacity:1}${p2}%,100%{transform:translateY(0);opacity:1}}`
    );

    for (let k = 0; k < height; k++) {
      const row = ROWS - 1 - k;
      const y = round(TOP + row * ROW_H);
      const bottom = row === ROWS - 1;
      blocks.push(
        `<rect class="d c${c}${bottom ? ' clr' : ''}" style="--from:${round(-(y + 40))}px" x="${x}" y="${y}" width="${CELL}" height="${ROW_H - 2}" rx="2" fill="${PIECES[c % PIECES.length]}" opacity="0.92"/>`
      );
    }
  });

  const style = `.d{animation-duration:${CYCLE}s;animation-iteration-count:infinite}
${weekly.map((_, c) => `.c${c}{animation-name:d${c}}`).join('')}
.stack{animation:collapse ${CYCLE}s infinite}
@keyframes collapse{0%,48%{transform:translateY(0)}52%,86%{transform:translateY(${ROW_H}px)}87%,100%{transform:translateY(0)}}
.clr{animation:clear ${CYCLE}s infinite}
@keyframes clear{0%,42%{fill:#fff;opacity:0}44%,47%{fill:#fff;opacity:1}52%,86%{fill:#fff;opacity:0}87%,100%{opacity:0}}
.well{animation:fade ${CYCLE}s infinite}
@keyframes fade{0%,86%{opacity:1}95%{opacity:0}96%,100%{opacity:1}}`;

  // The clearing row is drawn twice: the real block (animated by its column) and a
  // white flash overlay, so the flash is not fighting the drop animation for `fill`.
  const flash = weekly
    .map((total, c) =>
      total === 0
        ? ''
        : `<rect class="clr" x="${round(x0 + c * COL)}" y="${round(TOP + (ROWS - 1) * ROW_H)}" width="${CELL}" height="${ROW_H - 2}" rx="2" fill="#fff"/>`
    )
    .join('');

  const guides = Array.from({ length: ROWS + 1 }, (_, r) => {
    const y = round(TOP + r * ROW_H);
    return `<line x1="${x0 - 8}" y1="${y}" x2="${round(x0 + gridW + 8)}" y2="${y}" stroke="${DIM}" stroke-opacity="0.14" stroke-width="1"/>`;
  }).join('');

  const body = `
  <g class="well">
    ${guides}
    <g class="stack">${blocks.join('')}${flash}</g>
    <line x1="${x0 - 8}" y1="${floor}" x2="${round(x0 + gridW + 8)}" y2="${floor}" stroke="${DIM}" stroke-width="2"/>
  </g>
  <text x="24" y="30" font-family="${FONT}" font-size="13" font-weight="700" fill="${CYAN}" letter-spacing="2">53 WEEKS, STACKED</text>
  <text x="${WIDTH - 24}" y="30" text-anchor="end" font-family="${FONT}" font-size="13" font-weight="600" fill="${MUTED}" letter-spacing="1">LINE CLEAR EVERY ${CYCLE}s</text>
  ${caption(`EACH COLUMN IS ONE WEEK  ·  TALLEST WEEK ${peak} CONTRIBUTIONS`, H)}`;

  return card({
    height: H,
    title: 'My commit history as a Tetris well that clears a line',
    label: 'Weekly contribution totals stacked as Tetris columns; blocks drop in and the bottom row clears',
    style,
    body,
  });
}
