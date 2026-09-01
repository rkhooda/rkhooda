// The year as an audio waveform, with a playhead sweeping across it.
import { card, caption, esc, round, FONT, MUTED, DIM, BLUE, CYAN, PURPLE, WIDTH } from '../lib/svg.mjs';

export const id = 'waveform';

const H = 250;
const MID = 116;
const AMP = 74;
const STEP = 3;
const BAR = 2;
const CYCLE = 9;

export default function waveform(p) {
  const days = p.days;
  const x0 = round((WIDTH - days.length * STEP) / 2);

  // One path for all ~371 bars: far smaller than 371 <rect> elements, and it can be
  // reused by <use> for the lit layer instead of being emitted twice.
  let d = '';
  const ticks = [];
  let lastMonth = null;
  days.forEach((day, i) => {
    const x = round(x0 + i * STEP);
    const h = day.count ? 3 + Math.pow(day.count / p.max, 0.65) * AMP : 1.2;
    d += `M${x},${round(MID - h)}h${BAR}v${round(h * 2)}h${-BAR}z`;

    const month = day.date.slice(0, 7);
    if (month !== lastMonth) {
      lastMonth = month;
      ticks.push({ x, label: new Date(day.date + 'T00:00:00Z').toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }) });
    }
  });

  const grid = ticks
    .map(
      (t) =>
        `<line x1="${t.x}" y1="34" x2="${t.x}" y2="${MID + AMP + 14}" stroke="${DIM}" stroke-opacity="0.25" stroke-width="1"/>` +
        `<text x="${t.x + 5}" y="${MID + AMP + 26}" font-family="${FONT}" font-size="10" font-weight="600" fill="${MUTED}" letter-spacing="1">${t.label.toUpperCase()}</text>`
    )
    .join('');

  const defs = `
    <linearGradient id="hot" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${PURPLE}"/>
      <stop offset="0.5" stop-color="${CYAN}"/>
      <stop offset="1" stop-color="${PURPLE}"/>
    </linearGradient>
    <linearGradient id="sweepgrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000"/>
      <stop offset="0.55" stop-color="#4a4a4a"/>
      <stop offset="0.94" stop-color="#fff"/>
      <stop offset="1" stop-color="#fff"/>
    </linearGradient>
    <filter id="wglow" x="-20%" y="-40%" width="140%" height="180%">
      <feGaussianBlur stdDeviation="3.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <mask id="sweep" maskUnits="userSpaceOnUse" x="0" y="0" width="${WIDTH}" height="${H}">
      <rect x="-320" y="0" width="320" height="${H}" fill="url(#sweepgrad)">
        <animateTransform attributeName="transform" type="translate"
          values="0 0;1260 0;1560 0" keyTimes="0;0.86;1" dur="${CYCLE}s" repeatCount="indefinite"/>
      </rect>
    </mask>
    <path id="wave" d="${d}"/>`;

  const body = `
  ${grid}
  <line x1="${x0}" y1="${MID}" x2="${round(x0 + days.length * STEP)}" y2="${MID}" stroke="${DIM}" stroke-opacity="0.5" stroke-width="1"/>
  <use href="#wave" fill="#cdc2a4"/>
  <g mask="url(#sweep)"><use href="#wave" fill="url(#hot)" filter="url(#wglow)"/></g>
  <g opacity="0.9">
    <rect x="-1" y="30" width="2" height="${MID + AMP - 20}" fill="${CYAN}" filter="url(#wglow)">
      <animateTransform attributeName="transform" type="translate"
        values="0 0;1260 0;1560 0" keyTimes="0;0.86;1" dur="${CYCLE}s" repeatCount="indefinite"/>
    </rect>
  </g>
  <text x="24" y="30" font-family="${FONT}" font-size="13" font-weight="700" fill="${BLUE}" letter-spacing="2">NOW PLAYING</text>
  ${caption(`${p.total.toLocaleString('en-US')} CONTRIBUTIONS  ·  PEAK ${p.max} IN A DAY  ·  ${p.longest}-DAY STREAK`, H)}
  <text x="${WIDTH - 24}" y="30" text-anchor="end" font-family="${FONT}" font-size="13" font-weight="600" fill="${MUTED}" letter-spacing="1">${esc(days[0].date)} — ${esc(days[days.length - 1].date)}</text>`;

  return card({
    height: H,
    title: 'A year of commits, drawn as an audio waveform',
    label: `Contribution history rendered as an audio waveform: ${p.total} contributions with a playhead sweeping across the year`,
    defs,
    body,
  });
}
