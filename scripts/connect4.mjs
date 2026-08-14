// Applies one visitor move from an issue comment, plays the bot's reply and
// redraws the board. Triggered by .github/workflows/connect4.yml.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { rest } from './lib/gh.mjs';
import { readReadme, writeReadme, bustCache } from './lib/readme.mjs';
import { COLS, ROWS, EMPTY, HUMAN, BOT, idx, newBoard, drop, full, winner, bestMove, parseMove, render } from './lib/c4.mjs';
import { esc, round, FONT, BG, PANEL, FG, MUTED, DIM, CYAN, BLUE, RED, YELLOW, GREEN } from './lib/svg.mjs';

const ROOT = new URL('../', import.meta.url).pathname;
const STATE = `${ROOT}data/connect4.json`;
const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY;
const ISSUE = process.env.ISSUE_NUMBER;

export const FRESH = { board: newBoard(), humans: 0, bot: 0, draws: 0, games: 1, last: null, over: null, line: [], by: null };

const load = () => (existsSync(STATE) ? { ...FRESH, ...JSON.parse(readFileSync(STATE, 'utf8')) } : { ...FRESH });

const save = (state) => {
  mkdirSync(`${ROOT}data`, { recursive: true });
  writeFileSync(STATE, `${JSON.stringify(state, null, 2)}\n`);
};

// ------------------------------------------------------------------ rendering

const W = 520;
const CELL = 64;
const R = 25;
const X0 = 36;
const Y0 = 92;
const H = Y0 + ROWS * CELL + 46;

export function board(state) {
  const disc = { [HUMAN]: RED, [BOT]: YELLOW, [EMPTY]: '#171822' };
  const cells = [];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = idx(r, c);
      const cx = X0 + c * CELL + CELL / 2;
      const cy = Y0 + r * CELL + CELL / 2;
      const isLast = state.last && state.last.row === r && state.last.col === c;
      // Only the disc that was just played animates, and only once.
      const fall = isLast
        ? `<animateTransform attributeName="transform" type="translate" values="0 ${-(r + 1) * CELL - 60};0 0" dur="0.55s" calcMode="spline" keySplines="0.45 0 0.55 1" fill="freeze" repeatCount="1"/>`
        : '';
      cells.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="${disc[state.board[i]]}">${fall}</circle>`);
      if (state.line?.includes(i)) {
        cells.push(`<circle cx="${cx}" cy="${cy}" r="${R + 4}" fill="none" stroke="#fff" stroke-width="3">
          <animate attributeName="opacity" values="1;0.15;1" dur="1.3s" repeatCount="indefinite"/></circle>`);
      }
    }
  }

  const labels = [...Array(COLS).keys()]
    .map(
      (c) =>
        `<text x="${X0 + c * CELL + CELL / 2}" y="${Y0 - 14}" text-anchor="middle" font-family="${FONT}" font-size="15" font-weight="700" fill="${state.over ? DIM : CYAN}">${c + 1}</text>`
    )
    .join('');

  const status = state.over
    ? { H: 'A HUMAN WON', B: 'THE BOT WON', draw: 'A DRAW' }[state.over]
    : 'YOUR MOVE — COMMENT A COLUMN';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Connect 4 board. Humans ${state.humans}, bot ${state.bot}. ${status}">
  <title>Connect 4 against my bot — humans ${state.humans}, bot ${state.bot}</title>
  <rect width="${W}" height="${H}" rx="14" fill="${BG}"/>
  <text x="24" y="34" font-family="${FONT}" font-size="13" font-weight="700" fill="${CYAN}" letter-spacing="2">PLAY ME</text>
  <text x="${W - 24}" y="34" text-anchor="end" font-family="${FONT}" font-size="14" font-weight="700" fill="${FG}">
    <tspan fill="${RED}">HUMANS ${state.humans}</tspan><tspan fill="${MUTED}"> — </tspan><tspan fill="${YELLOW}">BOT ${state.bot}</tspan>
  </text>
  <text x="24" y="56" font-family="${FONT}" font-size="12" font-weight="600" fill="${MUTED}" letter-spacing="1">GAME ${state.games}${state.draws ? ` · ${state.draws} DRAWN` : ''}${state.by ? ` · LAST MOVE BY @${esc(state.by)}` : ''}</text>
  ${labels}
  <rect x="${X0 - 10}" y="${Y0 - 10}" width="${COLS * CELL + 20}" height="${ROWS * CELL + 20}" rx="14" fill="${PANEL}" stroke="${BLUE}" stroke-opacity="0.35"/>
  ${cells.join('')}
  <text x="24" y="${H - 16}" font-family="${FONT}" font-size="13" font-weight="700" fill="${state.over ? GREEN : MUTED}" letter-spacing="1.5">${status}</text>
</svg>
`;
}

// ----------------------------------------------------------------------- main
// Imported by build.mjs for the starting board, so only act when run directly.

if (process.argv[1] !== import.meta.filename) {
  // imported — nothing to do
} else {
  await play();
}

async function play() {
if (!TOKEN || !REPO || !ISSUE) throw new Error('GITHUB_TOKEN, GITHUB_REPOSITORY and ISSUE_NUMBER are required');

const col = parseMove(process.env.COMMENT_BODY);
const who = process.env.COMMENT_USER || 'someone';

if (col === null) {
  console.log('no move in that comment — ignoring');
  return;
}

const state = load();
let reply;

// A finished game stays on the board until someone plays again, so the result is
// visible on the profile rather than being wiped instantly.
if (state.over) {
  Object.assign(state, { board: newBoard(), over: null, line: [], last: null, games: state.games + 1 });
}

const played = drop(state.board, col, HUMAN);

if (!played) {
  reply = `Column ${col + 1} is full, @${who} — pick another one.`;
} else {
  state.board = played.board;
  state.last = { row: played.row, col: played.col, piece: HUMAN };
  state.by = who;

  const humanWin = winner(state.board);
  if (humanWin) {
    state.over = 'H';
    state.line = humanWin.line;
    state.humans++;
    reply = `**@${who} wins.** Humans ${state.humans} — bot ${state.bot}.\n\nComment a number to start a new game.`;
  } else if (full(state.board)) {
    state.over = 'draw';
    state.draws++;
    reply = `**Draw.** Nobody wins. Comment a number to start a new game.`;
  } else {
    const botCol = bestMove(state.board, BOT);
    const botPlayed = drop(state.board, botCol, BOT);
    state.board = botPlayed.board;
    state.last = { row: botPlayed.row, col: botPlayed.col, piece: BOT };

    const botWin = winner(state.board);
    if (botWin) {
      state.over = 'B';
      state.line = botWin.line;
      state.bot++;
      reply = `Bot drops column ${botCol + 1} and **wins**. Humans ${state.humans} — bot ${state.bot}.\n\nComment a number to start a new game.`;
    } else if (full(state.board)) {
      state.over = 'draw';
      state.draws++;
      reply = `Bot drops column ${botCol + 1}. **Draw.** Comment a number to start a new game.`;
    } else {
      reply = `@${who} played column ${col + 1}. Bot answers with column ${botCol + 1}.\n\nYour move — comment a number from 1 to 7.`;
    }
  }
}

save(state);
mkdirSync(`${ROOT}assets`, { recursive: true });
writeFileSync(`${ROOT}assets/connect4.svg`, board(state));
writeReadme(bustCache(readReadme(), ['assets/connect4.svg']));

await rest(`/repos/${REPO}/issues/${ISSUE}/comments`, TOKEN, {
  method: 'POST',
  body: JSON.stringify({ body: `${render(state.board)}\n\n${reply}` }),
});

console.log(`move=${col + 1} by=${who} over=${state.over ?? 'none'} score=${state.humans}-${state.bot}`);
}
