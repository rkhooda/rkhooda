// A side-scroller where the terrain is my weekly commit volume — busy weeks are the hills.
import { card, caption, round, noise, scale, FONT, MUTED, DIM, CYAN, PURPLE, BLUE, WIDTH } from '../lib/svg.mjs';

export const id = 'runner';

const H = 250;
const GROUND = 206;
const AMP = 74;
const X0 = 20;
const X1 = 1180;
const CYCLE = 16;

export default function runner(p) {
  const weekly = p.weeks.map((w) => w.reduce((s, d) => s + d.count, 0));
  // Smooth over three weeks: raw weekly totals make cliffs the runner can't ride.
  const smooth = weekly.map((_, i) => {
    const w = weekly.slice(Math.max(0, i - 1), i + 2);
    return w.reduce((s, v) => s + v, 0) / w.length;
  });
  const norm = scale(smooth, 0.9, 0.7);

  const pts = smooth.map((v, i) => ({
    x: round(X0 + (i * (X1 - X0)) / (smooth.length - 1)),
    y: round(GROUND - norm(v) * AMP),
  }));

  // Quadratic through midpoints: a continuous slope for <animateMotion> to ride.
  let top = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = round((pts[i].x + pts[i + 1].x) / 2);
    const my = round((pts[i].y + pts[i + 1].y) / 2);
    top += `Q${pts[i].x},${pts[i].y} ${mx},${my}`;
  }
  top += `L${pts[pts.length - 1].x},${pts[pts.length - 1].y}`;

  const stars = Array.from({ length: 46 }, (_, i) => {
    const x = round(noise(i, 3) * WIDTH);
    const y = round(24 + noise(i, 7) * 96);
    const r = round(0.7 + noise(i, 11) * 1.1);
    const dur = round(2.5 + noise(i, 13) * 3.5);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${BLUE}" opacity="0.5"><animate attributeName="opacity" values="0.15;0.7;0.15" dur="${dur}s" begin="-${round(noise(i, 17) * dur)}s" repeatCount="indefinite"/></circle>`;
  }).join('');

  const rider = (cls, opacity, begin) => `
  <g opacity="${opacity}">
    <animateMotion dur="${CYCLE}s" repeatCount="indefinite" rotate="auto" begin="${begin}">
      <mpath href="#terrain"/>
    </animateMotion>
    ${cls}
  </g>`;

  const character = `
    <g transform="translate(0 -11)">
      <rect x="-7" y="-8" width="14" height="15" rx="4" fill="${CYAN}"/>
      <rect x="-1" y="-5" width="6" height="4" rx="1.5" fill="#12131c"/>
      <g class="legs">
        <rect x="-5" y="6" width="3.5" height="6" rx="1.5" fill="${PURPLE}"/>
        <rect x="1.5" y="6" width="3.5" height="6" rx="1.5" fill="${PURPLE}"/>
      </g>
    </g>`;

  const trail = `<circle cx="0" cy="-10" r="3" fill="${CYAN}"/>`;

  const style = `.legs{animation:step 0.32s steps(2,end) infinite;transform-origin:0px 8px}
@keyframes step{0%{transform:skewX(24deg)}100%{transform:skewX(-24deg)}}`;

  const defs = `
    <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BLUE}" stop-opacity="0.32"/>
      <stop offset="1" stop-color="${BLUE}" stop-opacity="0.02"/>
    </linearGradient>
    <filter id="rglow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`;

  const body = `
  ${stars}
  <path d="${top}L${X1},${GROUND + 22}L${X0},${GROUND + 22}Z" fill="url(#hill)"/>
  <path id="terrain" d="${top}" fill="none" stroke="${CYAN}" stroke-width="2" stroke-linecap="round" filter="url(#rglow)"/>
  ${rider(trail, 0.2, '-0.55s')}
  ${rider(trail, 0.35, '-0.28s')}
  ${rider(character, 1, '0s')}
  <text x="24" y="30" font-family="${FONT}" font-size="13" font-weight="700" fill="${CYAN}" letter-spacing="2">TERRAIN: ${p.weeks.length} WEEKS</text>
  ${caption(`THE HILLS ARE THE BUSY WEEKS  ·  BIGGEST CLIMB ${Math.max(...weekly)} COMMITS IN ONE WEEK`, H)}`;

  return card({
    height: H,
    title: 'A runner crossing terrain built from my weekly commit volume',
    label: 'A side-scrolling runner following hills generated from weekly contribution totals',
    defs,
    style,
    body,
  });
}
