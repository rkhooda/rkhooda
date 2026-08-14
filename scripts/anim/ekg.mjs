// One heartbeat line across the year — spikes on active days, flatlines on the gaps.
import { card, caption, round, FONT, MUTED, DIM, GREEN, CYAN, WIDTH } from '../lib/svg.mjs';

export const id = 'ekg';

const H = 230;
const BASE = 142;
const AMP = 86;
const X0 = 40;
const X1 = 1160;
const CYCLE = 11;

export default function ekg(p) {
  const days = p.days;
  const dx = (X1 - X0) / days.length;

  let d = `M${X0},${BASE}`;
  let length = 0;
  let x = X0;
  let y = BASE;
  const lineTo = (nx, ny) => {
    length += Math.hypot(nx - x, ny - y);
    d += `L${round(nx)},${round(ny)}`;
    x = nx;
    y = ny;
  };

  for (const day of days) {
    if (day.count === 0) {
      lineTo(x + dx, BASE);
      continue;
    }
    const h = 6 + Math.pow(day.count / p.max, 0.6) * AMP;
    // Classic QRS shape: dip, tall spike, undershoot, recover.
    lineTo(x + dx * 0.18, BASE + 4);
    lineTo(x + dx * 0.42, BASE - h);
    lineTo(x + dx * 0.62, BASE + h * 0.22);
    lineTo(x + dx, BASE);
  }

  const paper = Array.from({ length: 24 }, (_, i) => {
    const gx = round(X0 + (i * (X1 - X0)) / 23);
    return `<line x1="${gx}" y1="26" x2="${gx}" y2="${BASE + 46}" stroke="${DIM}" stroke-opacity="0.18" stroke-width="1"/>`;
  }).join('');

  const total = round(length);
  const style = `.trace{fill:none;stroke:${GREEN};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;
    stroke-dasharray:${total};animation:draw ${CYCLE}s linear infinite}
@keyframes draw{0%{stroke-dashoffset:${total};opacity:1}62%{stroke-dashoffset:0;opacity:1}92%{stroke-dashoffset:0;opacity:1}99%{stroke-dashoffset:0;opacity:0}100%{stroke-dashoffset:${total};opacity:0}}`;

  const defs = `<filter id="eglow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`;

  const avg = (p.total / days.length).toFixed(1);

  const body = `
  ${paper}
  <line x1="${X0}" y1="${BASE}" x2="${X1}" y2="${BASE}" stroke="${DIM}" stroke-opacity="0.45" stroke-width="1"/>
  <path id="ekgpath" class="trace" d="${d}" filter="url(#eglow)"/>
  <circle r="4" fill="#fff" filter="url(#eglow)">
    <animateMotion dur="${CYCLE}s" repeatCount="indefinite" calcMode="linear" keyTimes="0;0.62;1" keyPoints="0;1;1">
      <mpath href="#ekgpath"/>
    </animateMotion>
    <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.62;0.66;1" dur="${CYCLE}s" repeatCount="indefinite"/>
  </circle>
  <text x="24" y="30" font-family="${FONT}" font-size="13" font-weight="700" fill="${GREEN}" letter-spacing="2">STILL ALIVE</text>
  <text x="${WIDTH - 24}" y="30" text-anchor="end" font-family="${FONT}" font-size="13" font-weight="600" fill="${CYAN}" letter-spacing="1">${avg} BPM AVG</text>
  ${caption(`${p.total.toLocaleString('en-US')} BEATS OVER ${days.length} DAYS  ·  LONGEST RUN ${p.longest} DAYS`, H)}`;

  return card({
    height: H,
    title: 'My contribution history as a heartbeat monitor',
    label: `An EKG line drawn from daily contributions, averaging ${avg} per day`,
    defs,
    style,
    body,
  });
}
