// Light → dark. Every colour the light cards use has one dark counterpart, so a
// finished light SVG becomes its dark twin with a single pass. The README pairs
// the two files with <picture>, which GitHub switches with its own theme setting.
//
// Dark is "ink": a warm graphite ground, cream type and one quiet slate accent.
// Green is kept only for the things that draw contributions (ramp, streak).
export const DARK = {
  // ground and type
  '#f4e9cf': '#15161a', // BG
  '#e9dcbd': '#1f1e23', // PANEL
  '#2d2a20': '#f1e7c9', // FG
  '#7a7460': '#8a8794', // MUTED
  '#cdc2a4': '#2f2e36', // DIM
  // contribution ramp
  '#e4dac1': '#1e1f24',
  '#cfcf96': '#27402f',
  '#a9ad58': '#357a4b',
  '#7f8a3a': '#5fb37e',
  '#4f5a22': '#8fd3a8',
  // accents
  '#56708a': '#8fa3b8', // BLUE
  '#3f8a86': '#a3b1c2', // CYAN — card headers, headphones
  '#7d5477': '#b09cb8', // PURPLE
  '#5f3f5a': '#8f7f98', // VIOLET
  '#b5573f': '#d8907c', // RED
  '#8a9a4a': '#9fcf9a', // GREEN
  '#6b7a3a': '#8fd3a8', // YELLOW — the streak colour, stays green
  // hero scenery
  '#ece2cb': '#101014', // sky top
  '#f6efe0': '#1d1d24', // sky bottom
  '#262319': '#0e0e11', // screens
  '#c9bc9c': '#2c2b33',
  '#bcae8e': '#25242b',
  '#b5a887': '#222128',
  '#d3c7a8': '#2a2930',
  '#b0a383': '#232229',
  '#3a3128': '#26252c', // hair
  '#c9a03a': '#f1e7c9', // sun → cream (name gradient mid-stop)
  '#6a6450': '#a9a6b3', // subtitle
  '#8f877a': '#f0ede2', // cat
};

const RE = /#[0-9a-fA-F]{6}\b/g;

/** Return the dark twin of a light SVG string. Unknown colours pass through. */
export const dark = (svg) => svg.replace(RE, (hex) => DARK[hex.toLowerCase()] ?? hex);
