// Rain over the contribution grid, pooling in the weeks where nothing happened.
import { card, caption, round, noise, scale, FONT, MUTED, DIM, CYAN, BLUE, LEVELS, WIDTH } from '../lib/svg.mjs';

export const id = 'weather';

const H = 250;
const STEP = 20;
const CELL = 16;
const ROWS = 7;
const TOP = 52;
const DROPS = 80;

export default function weather(p) {
  const cols = p.weeks.length;
  const gridW = cols * STEP - (STEP - CELL);
  const x0 = round((WIDTH - gridW) / 2);
  const floor = TOP + ROWS * STEP - (STEP - CELL);

  const weekly = p.weeks.map((w) => w.reduce((s, d) => s + d.count, 0));
  const norm = scale(weekly, 0.9, 0.7);

  const cells = p.weeks
    .flatMap((week, c) =>
      week.map((day, r) => {
        const x = round(x0 + c * STEP);
        const y = TOP + r * STEP;
        return `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3" fill="${LEVELS[day.level]}"/>`;
      })
    )
    .join('');

  // Quiet weeks flood; busy weeks stay above the surface.
  const surface = weekly.map((total, c) => ({
    x: round(x0 + c * STEP - (STEP - CELL) / 2),
    y: round(floor - 14 - (1 - norm(total)) * 84),
  }));

  let water = `M${surface[0].x},${surface[0].y}`;
  for (let i = 1; i < surface.length; i++) water += `L${surface[i].x},${surface[i].y}`;
  water += `L${round(x0 + gridW)},${surface[surface.length - 1].y}L${round(x0 + gridW)},${floor + 18}L${surface[0].x},${floor + 18}Z`;

  const rain = Array.from({ length: DROPS }, (_, i) => {
    const x = round(20 + noise(i, 5) * (WIDTH - 40));
    const dur = round(1.0 + noise(i, 9) * 1.3);
    const len = round(9 + noise(i, 15) * 12);
    const skew = round(2 + noise(i, 21) * 3);
    return `<line x1="${x}" y1="-20" x2="${round(x - skew)}" y2="${-20 + len}" stroke="${CYAN}" stroke-opacity="${round(0.2 + noise(i, 27) * 0.4)}" stroke-width="1.2" stroke-linecap="round">
      <animateTransform attributeName="transform" type="translate" values="0 0;${-skew * 12} ${H + 40}" dur="${dur}s" begin="-${round(noise(i, 31) * dur)}s" repeatCount="indefinite"/>
    </line>`;
  }).join('');

  const ripples = Array.from({ length: 14 }, (_, i) => {
    const c = Math.floor(noise(i, 41) * cols);
    const dur = round(1.9 + noise(i, 43) * 1.8);
    return `<ellipse cx="${surface[c].x}" cy="${surface[c].y}" rx="2" ry="1" fill="none" stroke="${CYAN}" stroke-width="1.2">
      <animate attributeName="rx" values="1;16" dur="${dur}s" begin="-${round(noise(i, 47) * dur)}s" repeatCount="indefinite"/>
      <animate attributeName="ry" values="0.5;5" dur="${dur}s" begin="-${round(noise(i, 47) * dur)}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.75;0" dur="${dur}s" begin="-${round(noise(i, 47) * dur)}s" repeatCount="indefinite"/>
    </ellipse>`;
  }).join('');

  const defs = `
    <linearGradient id="deep" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${CYAN}" stop-opacity="0.42"/>
      <stop offset="1" stop-color="${BLUE}" stop-opacity="0.16"/>
    </linearGradient>
    <clipPath id="cardclip"><rect width="${WIDTH}" height="${H}" rx="14"/></clipPath>`;

  const driest = weekly.indexOf(Math.min(...weekly));

  const body = `
  <g clip-path="url(#cardclip)">
    ${cells}
    <g>
      <path d="${water}" fill="url(#deep)">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 2.5;0 0" dur="4.5s" repeatCount="indefinite"/>
      </path>
      <path d="${water}" fill="none" stroke="${CYAN}" stroke-opacity="0.55" stroke-width="1.5">
        <animateTransform attributeName="transform" type="translate" values="0 1.5;0 -1.5;0 1.5" dur="3.2s" repeatCount="indefinite"/>
      </path>
    </g>
    ${ripples}
    ${rain}
  </g>
  <text x="24" y="30" font-family="${FONT}" font-size="13" font-weight="700" fill="${CYAN}" letter-spacing="2">FORECAST: RAIN</text>
  <text x="${WIDTH - 24}" y="30" text-anchor="end" font-family="${FONT}" font-size="13" font-weight="600" fill="${MUTED}" letter-spacing="1">WEEK ${driest + 1} IS UNDERWATER</text>
  ${caption('THE QUIET WEEKS FLOOD  ·  THE BUSY ONES STAY DRY', H)}`;

  return card({
    height: H,
    title: 'Rain pooling in the quiet weeks of my contribution graph',
    label: 'Rain falls over the contribution grid and water pools where contributions were lowest',
    defs,
    body,
  });
}
