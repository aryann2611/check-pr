import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCommit } from '../src/index.js';

test('accepts a valid message', () => {
  assert.deepEqual(validateCommit('feat(api): add endpoint'), []);
});

test('rejects a non-conventional header', () => {
  assert.equal(validateCommit('added stuff').length, 1);
});

test('rejects unknown types', () => {
  assert.deepEqual(validateCommit('wip: save'), ['unknown type "wip"']);
});

test('rejects long headers and trailing periods', () => {
  const problems = validateCommit(`fix: ${'a'.repeat(70)}.`);
  assert.equal(problems.length, 2);
});

test('throws on non-string input', () => {
  assert.throws(() => validateCommit(null), TypeError);
});
