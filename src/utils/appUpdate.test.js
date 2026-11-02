import test from 'node:test';
import assert from 'node:assert/strict';
import { hasNewBuild } from './appUpdate.js';

test('detects a different deployed build', () => {
  assert.equal(hasNewBuild('abc', { build: 'def' }), true);
});

test('same build is not an update', () => {
  assert.equal(hasNewBuild('abc', { build: 'abc' }), false);
  assert.equal(hasNewBuild('abc', { build: ' abc\n' }), false);
});

test('ignores missing or malformed responses', () => {
  for (const payload of [null, undefined, 'abc', {}, { build: '' }, { build: 42 }]) {
    assert.equal(hasNewBuild('abc', payload), false);
  }
  assert.equal(hasNewBuild('', { build: 'def' }), false);
});
