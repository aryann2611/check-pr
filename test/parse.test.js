import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCommit } from '../src/index.js';

test('parses type and description', () => {
  assert.deepEqual(parseCommit('fix: handle empty input'), {
    type: 'fix',
    scope: null,
    breaking: false,
    description: 'handle empty input',
    body: '',
    footers: [],
  });
});

test('parses scope', () => {
  const c = parseCommit('feat(api): add endpoint');
  assert.equal(c.type, 'feat');
  assert.equal(c.scope, 'api');
});

test('! marks a breaking change', () => {
  assert.equal(parseCommit('feat(api)!: drop v1').breaking, true);
  assert.equal(parseCommit('feat!: drop v1').breaking, true);
});

test('parses body and footers', () => {
  const c = parseCommit('fix: x\n\nLonger explanation\nover two lines.\n\nCloses #12\nReviewed-by: Sam');
  assert.equal(c.body, 'Longer explanation\nover two lines.');
  assert.deepEqual(c.footers, [
    { token: 'Closes', value: '12' },
    { token: 'Reviewed-by', value: 'Sam' },
  ]);
});

test('BREAKING CHANGE footer marks a breaking change', () => {
  const c = parseCommit('feat: x\n\nBREAKING CHANGE: config format changed');
  assert.equal(c.breaking, true);
  assert.equal(c.footers[0].token, 'BREAKING CHANGE');
});

test('last paragraph that is not all footers stays in the body', () => {
  const c = parseCommit('fix: x\n\nNote: this line is prose\nand so is this one');
  assert.equal(c.footers.length, 0);
  assert.equal(c.body, 'Note: this line is prose\nand so is this one');
});

test('handles CRLF line endings', () => {
  assert.equal(parseCommit('fix: x\r\n\r\nbody text').body, 'body text');
});

test('returns null for non-conforming headers', () => {
  for (const bad of ['', 'just some words', 'feat:no space', 'feat: ', 'feat(): x', '(scope): x']) {
    assert.equal(parseCommit(bad), null, JSON.stringify(bad));
  }
});

test('throws TypeError for non-string input', () => {
  for (const bad of [undefined, null, 42, Buffer.from('fix: x')]) {
    assert.throws(() => parseCommit(bad), TypeError);
  }
});
