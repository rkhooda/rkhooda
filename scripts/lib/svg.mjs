// Shared SVG vocabulary — the "darkroom" palette: warm charcoal, amber safelight,
// terracotta, with dusty cool tones kept quiet in support. Matches assets/hero.svg.

export const BG = '#1b1815';
export const PANEL = '#24201b';
export const FG = '#efe6d8';
export const MUTED = '#8c8071';
export const DIM = '#453d34';
export const BLUE = '#7a9db5';
export const CYAN = '#86bdb6';
export const PURPLE = '#bd97ab';
export const VIOLET = '#9e7791';
export const RED = '#e5674a';
export const GREEN = '#9fb26c';
export const YELLOW = '#f4a72a';

// Contribution levels 0-4: unlit → full amber.
export const LEVELS = ['#262119', '#4a3d2c', '#8a6a34', '#c98d2e', '#f4a72a'];

export const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
export const MONO = "'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace";

export const WIDTH = 1200;

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

export const round = (n) => Math.round(n * 100) / 100;

/**
 * Map values to 0..1 against a high percentile instead of the max. A single
 * outlier week (one 200-commit sprint) otherwise squashes the whole rest of the
 * year to a flat line.
 */
export function scale(values, percentile = 0.85, gamma = 0.7) {
  const active = values.filter((v) => v > 0).sort((a, b) => a - b);
  const ref = active.length ? active[Math.min(active.length - 1, Math.floor(active.length * percentile))] : 1;
  return (v) => Math.min(1, Math.pow(Math.max(0, v) / Math.max(1, ref), gamma));
}

/** Deterministic 0..1 noise — animations must be identical on every rebuild. */
export const noise = (i, salt = 1) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Every animation is one self-contained card of the same width, so the README
 * can swap them in a single slot without the layout jumping.
 */
export function card({ height, title, label, defs = '', style = '', body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${height}" width="${WIDTH}" height="${height}" role="img" aria-label="${esc(label ?? title)}">
  <title>${esc(title)}</title>
  <defs>${defs}</defs>
  <style>${style}</style>
  <rect width="${WIDTH}" height="${height}" rx="14" fill="${BG}"/>
  ${body}
</svg>
`;
}

/** Bottom-left caption used by every card, so the rotation feels like one series. */
export function caption(text, height, accent = MUTED) {
  return `<text x="24" y="${height - 16}" font-family="${FONT}" font-size="13" font-weight="600" fill="${accent}" letter-spacing="1.5">${esc(text)}</text>`;
}
