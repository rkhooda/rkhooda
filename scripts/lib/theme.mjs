// Light → dark. Every colour the light cards use has one dark counterpart, so a
// finished light SVG becomes its dark twin with a single pass. The README pairs
// the two files with <picture>, which GitHub switches with its own theme setting.
export const DARK = {
  // ground and type
  '#f4e9cf': '#0f1a14', // BG
  '#e9dcbd': '#16231a', // PANEL
  '#2d2a20': '#f1e7c9', // FG
  '#7a7460': '#7d8f7e', // MUTED
  '#cdc2a4': '#2a3a2e', // DIM
  // contribution ramp
  '#e4dac1': '#172419',
  '#cfcf96': '#22412c',
  '#a9ad58': '#357a4b',
  '#7f8a3a': '#5fb37e',
  '#4f5a22': '#8fd3a8',
  // accents
  '#56708a': '#86aac6', // BLUE
  '#3f8a86': '#8fd3a8', // CYAN
  '#7d5477': '#b8a1c9', // PURPLE
  '#5f3f5a': '#9683a8', // VIOLET
  '#b5573f': '#e8846a', // RED
  '#8a9a4a': '#a3c29a', // GREEN
  '#6b7a3a': '#8fd3a8', // YELLOW — the streak colour
  // hero scenery
  '#ece2cb': '#0b140f', // sky top
  '#f6efe0': '#152219', // sky bottom
  '#262319': '#0a120d', // screens
  '#c9bc9c': '#263a2d',
  '#bcae8e': '#1f3025',
  '#b5a887': '#1c2c22',
  '#d3c7a8': '#233529',
  '#b0a383': '#1e2e24',
  '#3a3128': '#1d2a21', // hair
  '#c9a03a': '#f1e7c9', // sun → cream (name gradient mid-stop)
  '#6a6450': '#a6b8a4', // subtitle
  '#8f877a': '#f0ede2', // cat
};

const RE = /#[0-9a-fA-F]{6}\b/g;

/** Return the dark twin of a light SVG string. Unknown colours pass through. */
export const dark = (svg) => svg.replace(RE, (hex) => DARK[hex.toLowerCase()] ?? hex);
