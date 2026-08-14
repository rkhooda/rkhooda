// node scripts/test.mjs — covers the logic that can silently go wrong.
import assert from 'node:assert/strict';
import { COLS, ROWS, EMPTY, HUMAN, BOT, idx, newBoard, drop, legal, full, winner, bestMove, parseMove } from './lib/c4.mjs';
import { scale, noise } from './lib/svg.mjs';
import { updateSection, bustCache } from './lib/readme.mjs';

const build = (rows) => rows.join('');
const at = (board, r, c) => board[idx(r, c)];

// --- drop -------------------------------------------------------------------
{
  const b = drop(newBoard(), 3, HUMAN);
  assert.equal(b.row, ROWS - 1, 'first disc lands on the floor');
  assert.equal(at(b.board, ROWS - 1, 3), HUMAN);

  const stacked = drop(b.board, 3, BOT);
  assert.equal(stacked.row, ROWS - 2, 'second disc stacks on the first');

  assert.equal(drop(newBoard(), 7, HUMAN), null, 'column 7 is out of range');
  assert.equal(drop(newBoard(), -1, HUMAN), null, 'negative column rejected');
  assert.equal(drop(newBoard(), 1.5, HUMAN), null, 'non-integer column rejected');

  let column = newBoard();
  for (let i = 0; i < ROWS; i++) column = drop(column, 0, HUMAN).board;
  assert.equal(drop(column, 0, HUMAN), null, 'a full column rejects further discs');
  assert.deepEqual(legal(column), [1, 2, 3, 4, 5, 6]);
}

// --- winner -----------------------------------------------------------------
{
  assert.equal(winner(newBoard()), null, 'empty board has no winner');

  const horizontal = build(['.......', '.......', '.......', '.......', '.......', 'HHHH...']);
  assert.equal(winner(horizontal).piece, HUMAN, 'horizontal four detected');
  assert.equal(winner(horizontal).line.length, 4);

  const vertical = build(['.......', '.......', '..B....', '..B....', '..B....', '..B....']);
  assert.equal(winner(vertical).piece, BOT, 'vertical four detected');

  const diagonal = build(['.......', '.......', '...H...', '..HB...', '.HBB...', 'HBBB...']);
  assert.equal(winner(diagonal).piece, HUMAN, 'rising diagonal detected');

  const antiDiagonal = build(['.......', '.......', 'H......', 'BH.....', 'BBH....', 'BBBH...']);
  assert.equal(winner(antiDiagonal).piece, HUMAN, 'falling diagonal detected');

  const three = build(['.......', '.......', '.......', '.......', '.......', 'HHH....']);
  assert.equal(winner(three), null, 'three in a row is not a win');

  // A four spanning two different pieces must not count.
  const mixed = build(['.......', '.......', '.......', '.......', '.......', 'HHBH...']);
  assert.equal(winner(mixed), null, 'mixed run is not a win');
}

// --- bot --------------------------------------------------------------------
{
  // Bot has three in a row on the floor and column 3 is open: it must finish.
  const canWin = build(['.......', '.......', '.......', '.......', '.......', 'BBB....']);
  assert.equal(bestMove(canWin, BOT), 3, 'bot takes the immediate win');

  // Human threatens on the floor; bot has nothing better, so it must block.
  const mustBlock = build(['.......', '.......', '.......', '.......', '.......', 'HHH....']);
  assert.equal(bestMove(mustBlock, BOT), 3, 'bot blocks the immediate threat');

  // Winning beats blocking when both are available.
  const both = build(['.......', '.......', '.......', '.......', 'BBB....', 'HHH....']);
  assert.equal(bestMove(both, BOT), 3, 'bot prefers its own win over a block');

  assert.equal(bestMove(newBoard(), BOT), 3, 'opens in the centre');

  // Never returns an illegal column.
  let board = newBoard();
  for (let turn = 0; turn < 12 && !winner(board) && !full(board); turn++) {
    const col = bestMove(board, turn % 2 ? HUMAN : BOT, 3);
    assert.ok(legal(board).includes(col), `move ${col} must be legal on turn ${turn}`);
    board = drop(board, col, turn % 2 ? HUMAN : BOT).board;
  }
}

// --- parseMove --------------------------------------------------------------
{
  assert.equal(parseMove('4'), 3, 'bare number');
  assert.equal(parseMove('col 7 please'), 6, 'number in a sentence');
  assert.equal(parseMove('drop it in 1!'), 0);
  assert.equal(parseMove('8'), null, 'out of range ignored');
  assert.equal(parseMove('42'), null, 'multi-digit is not a column');
  assert.equal(parseMove('nice profile'), null, 'chatter is not a move');
  assert.equal(parseMove(''), null);
  assert.equal(parseMove(undefined), null);
}

// --- scale ------------------------------------------------------------------
{
  // One huge outlier must not flatten everything else — that was a real bug.
  const weeks = [5, 8, 12, 9, 7, 11, 6, 10, 209];
  const norm = scale(weeks);
  assert.ok(norm(209) === 1, 'the outlier saturates at 1');
  assert.ok(norm(8) > 0.3, `a typical week keeps real height, got ${norm(8)}`);
  assert.ok(norm(0) === 0, 'an empty week is flat');
  assert.ok(norm(12) > norm(5), 'ordering preserved');
  assert.equal(scale([], 0.9, 0.7)(0), 0, 'empty input does not divide by zero');
}

// --- noise ------------------------------------------------------------------
{
  assert.equal(noise(3, 5), noise(3, 5), 'noise is deterministic across rebuilds');
  assert.notEqual(noise(3, 5), noise(4, 5), 'different indices differ');
  for (let i = 0; i < 200; i++) {
    const n = noise(i, 7);
    assert.ok(n >= 0 && n < 1, `noise stays in range, got ${n}`);
  }
}

// --- readme -----------------------------------------------------------------
{
  const md = 'top\n<!-- building:start -->\nold\n<!-- building:end -->\nbottom';
  const out = updateSection(md, 'building', 'new');
  assert.ok(out.includes('new') && !out.includes('old'), 'section replaced');
  assert.ok(out.startsWith('top') && out.endsWith('bottom'), 'surrounding text untouched');
  assert.throws(() => updateSection('no markers', 'building', 'x'), /missing/, 'missing markers are loud');

  const busted = bustCache('![a](assets/anim/today.svg?v=abc)', ['assets/anim/today.svg'], 'zzz');
  assert.ok(busted.includes('today.svg?v=zzz'), 'cache param bumped');
  const untouched = bustCache('![a](assets/other.svg?v=abc)', ['assets/anim/today.svg'], 'zzz');
  assert.ok(untouched.includes('?v=abc'), 'other images left alone');
}

console.log('all checks passed');
