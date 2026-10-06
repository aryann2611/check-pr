#!/usr/bin/env node
import { checkPullRequest } from '../src/github.js';

const [slug, num] = process.argv.slice(2);
const [owner, repo] = (slug ?? '').split('/');
const number = Number(num);
if (!owner || !repo || !Number.isInteger(number)) {
  console.error('usage: check-pr <owner>/<repo> <pr-number>   (set GITHUB_TOKEN for private repos)');
  process.exit(2);
}

try {
  const bad = await checkPullRequest({ owner, repo, number, token: process.env.GITHUB_TOKEN });
  for (const { sha, subject, problems } of bad) console.log(`${sha} ${subject}\n  - ${problems.join('\n  - ')}`);
  console.log(bad.length ? `${bad.length} commit(s) need fixing` : 'all commit messages look good');
  process.exitCode = bad.length ? 1 : 0;
} catch (err) {
  console.error(err.message);
  process.exitCode = 2;
}
