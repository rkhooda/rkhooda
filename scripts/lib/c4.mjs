// Connect 4 rules and bot. Pure functions, no I/O — see scripts/test.mjs.

export const COLS = 7;
export const ROWS = 6;
export const EMPTY = '.';
export const HUMAN = 'H';
export const BOT = 'B';

export const idx = (r, c) => r * COLS + c;
export const newBoard = () => EMPTY.repeat(COLS * ROWS);
export const legal = (board) => [...Array(COLS).keys()].filter((c) => board[idx(0, c)] === EMPTY);
export const full = (board) => !board.includes(EMPTY);

/** Drop a piece down a column. Returns null if the column is full or out of range. */
export function drop(board, col, piece) {
  if (!Number.isInteger(col) || col < 0 || col >= COLS) return null;
  for (let r = ROWS - 1; r >= 0; r--) {
    const i = idx(r, col);
    if (board[i] === EMPTY) return { board: board.slice(0, i) + piece + board.slice(i + 1), row: r, col };
  }
  return null;
}

const DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

/** Every 4-in-a-row window on the board, precomputed once. */
const WINDOWS = (() => {
  const out = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of DIRS) {
        const cells = [];
        for (let k = 0; k < 4; k++) {
          const rr = r + dr * k;
          const cc = c + dc * k;
          if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) break;
          cells.push(idx(rr, cc));
        }
        if (cells.length === 4) out.push(cells);
      }
    }
  }
  return out;
})();

/** The winning piece and its four cells, or null. */
export function winner(board) {
  for (const cells of WINDOWS) {
    const p = board[cells[0]];
    if (p !== EMPTY && cells.every((i) => board[i] === p)) return { piece: p, line: cells };
  }
  return null;
}

function evaluate(board, me) {
  const opp = me === BOT ? HUMAN : BOT;
  let total = 0;
  for (const cells of WINDOWS) {
    let mine = 0;
    let theirs = 0;
    for (const i of cells) {
      if (board[i] === me) mine++;
      else if (board[i] === opp) theirs++;
    }
    if (mine && theirs) continue;
    if (mine === 3) total += 50;
    else if (mine === 2) total += 5;
    if (theirs === 3) total -= 80; // blocking is worth more than building
    else if (theirs === 2) total -= 5;
  }
  // Centre control is the single strongest positional feature in Connect 4.
  for (let r = 0; r < ROWS; r++) if (board[idx(r, 3)] === me) total += 6;
  return total;
}

// Search the centre first so alpha-beta prunes early and ties break toward the middle.
const ORDER = [3, 2, 4, 1, 5, 0, 6];

function minimax(board, depth, alpha, beta, maximizing, me) {
  const opp = me === BOT ? HUMAN : BOT;
  const win = winner(board);
  if (win) return win.piece === me ? 100000 + depth : -100000 - depth;
  if (full(board) || depth === 0) return evaluate(board, me);

  let best = maximizing ? -Infinity : Infinity;
  for (const col of ORDER) {
    const next = drop(board, col, maximizing ? me : opp);
    if (!next) continue;
    const value = minimax(next.board, depth - 1, alpha, beta, !maximizing, me);
    if (maximizing) {
      best = Math.max(best, value);
      alpha = Math.max(alpha, value);
    } else {
      best = Math.min(best, value);
      beta = Math.min(beta, value);
    }
    if (beta <= alpha) break;
  }
  return best;
}

/**
 * Depth 4 by default: sees immediate wins and blocks, misses deeper traps. A
 * perfect bot would make the scoreboard permanently 0 and nobody would play twice.
 */
export function bestMove(board, piece = BOT, depth = 4) {
  let bestCol = legal(board)[0] ?? null;
  let bestScore = -Infinity;
  for (const col of ORDER) {
    const next = drop(board, col, piece);
    if (!next) continue;
    const score = minimax(next.board, depth - 1, -Infinity, Infinity, false, piece);
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }
  return bestCol;
}

/** Parse a player's comment into a column index. Returns null if there is no move in it. */
export function parseMove(body) {
  const match = String(body ?? '').match(/(?:^|[^\d])([1-7])(?![\d])/);
  return match ? Number(match[1]) - 1 : null;
}

export function render(board) {
  const rows = [];
  for (let r = 0; r < ROWS; r++) {
    rows.push([...Array(COLS).keys()].map((c) => ({ [EMPTY]: '⚫', [HUMAN]: '🔴', [BOT]: '🟡' }[board[idx(r, c)]])).join(''));
  }
  return `${rows.join('\n')}\n1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣`;
}
