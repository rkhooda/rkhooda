// node scripts/test.mjs — covers the logic that can silently go wrong.
import assert from 'node:assert/strict';
import * as svg from './lib/svg.mjs';
import { DARK, dark } from './lib/theme.mjs';
const { scale, noise } = svg;
import { updateSection, bustCache } from './lib/readme.mjs';
import pendulum, { CYCLE } from './anim/pendulum.mjs';

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

// --- theme ------------------------------------------------------------------
{
  // Every light token must have a dark twin, or a card would ship half-themed.
  const tokens = Object.entries(svg).filter(([, v]) => typeof v === 'string' && /^#[0-9a-f]{6}$/.test(v));
  for (const [name, hex] of [...tokens, ...svg.LEVELS.map((h, i) => [`LEVELS[${i}]`, h])]) {
    assert.ok(DARK[hex], `${name} (${hex}) has no dark counterpart`);
  }
  assert.equal(dark(`<rect fill="${svg.BG}"/>`), `<rect fill="${DARK[svg.BG]}"/>`, 'dark() swaps a token');
  assert.equal(dark('<rect fill="#b78e6c"/>'), '<rect fill="#b78e6c"/>', 'unknown colours pass through');
}

// --- pendulum ---------------------------------------------------------------
{
  // The wave only re-forms if every column swings a whole number of times per
  // cycle, and only active weeks may move at all.
  const week = (count) => Array.from({ length: 7 }, () => ({ count, level: count ? 2 : 0 }));
  const out = pendulum({ weeks: [week(0), week(4), week(40)], total: 308 });
  const swings = [...out.matchAll(/values="0 [\d.]+ [\d.]+;(-?[\d.]+) [^"]*" [^>]*dur="([\d.]+)s"/g)];
  assert.equal(swings.length, 2, 'only active weeks swing');
  for (const [, , dur] of swings) {
    const n = CYCLE / Number(dur);
    assert.ok(Math.abs(n - Math.round(n)) < 1e-3, `${dur}s does not divide the cycle, got ${n} swings`);
  }
  assert.ok(Number(swings[1][1]) > Number(swings[0][1]), 'the busier week swings wider');
}

console.log('all checks passed');
