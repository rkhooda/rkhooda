// node scripts/test.mjs — covers the logic that can silently go wrong.
import assert from 'node:assert/strict';
import { scale, noise } from './lib/svg.mjs';
import { updateSection, bustCache } from './lib/readme.mjs';

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
