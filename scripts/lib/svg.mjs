// Shared SVG vocabulary. Everything is tokyonight, matching the existing hero.

export const BG = '#1a1b26';
export const PANEL = '#20222f';
export const FG = '#c0caf5';
export const MUTED = '#565f89';
export const DIM = '#414868';
export const BLUE = '#7aa2f7';
export const CYAN = '#7dcfff';
export const PURPLE = '#bb9af7';
export const VIOLET = '#9d7cd8';
export const RED = '#f7768e';
export const GREEN = '#9ece6a';
export const YELLOW = '#e0af68';

// Contribution levels 0-4, same ramp the snake already uses on this profile.
export const LEVELS = ['#232433', '#3b4261', '#7aa2f7', '#bb9af7', '#9d7cd8'];

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
