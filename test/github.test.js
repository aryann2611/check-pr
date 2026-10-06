import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPullRequest } from '../src/index.js';

const reply = (status, body) => async (url, init) => {
  reply.last = { url, init };
  return { ok: status < 400, status, json: async () => body };
};
const commit = (sha, message) => ({ sha, commit: { message } });

test('reports only invalid commits', async () => {
  const fetch = reply(200, [commit('a'.repeat(40), 'feat: ok'), commit('b'.repeat(40), 'oops.\n\nbody')]);
  const bad = await checkPullRequest({ owner: 'o', repo: 'r', number: 3, fetch });
  assert.deepEqual(bad.map((c) => [c.sha, c.subject]), [['bbbbbbb', 'oops.']]);
  assert.match(reply.last.url, /\/repos\/o\/r\/pulls\/3\/commits/);
  assert.equal(reply.last.init.headers.Authorization, undefined);
});

test('sends the token when given', async () => {
  await checkPullRequest({ owner: 'o', repo: 'r', number: 1, token: 't', fetch: reply(200, []) });
  assert.equal(reply.last.init.headers.Authorization, 'Bearer t');
});

test('throws on API errors', async () => {
  await assert.rejects(checkPullRequest({ owner: 'o', repo: 'r', number: 1, fetch: reply(404, {}) }), /404/);
});
