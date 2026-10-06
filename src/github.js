import { validateCommit } from './validate.js';

/**
 * Check every commit message of a pull request using the GitHub REST API.
 * @param {{owner: string, repo: string, number: number, token?: string, fetch?: typeof fetch}} opts
 * @returns {Promise<{sha: string, subject: string, problems: string[]}[]>} one entry per invalid commit.
 */
export async function checkPullRequest({ owner, repo, number, token, fetch = globalThis.fetch }) {
  // ponytail: first 100 commits only; follow the Link header if PRs that large matter
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${number}/commits?per_page=100`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'check-pr',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${owner}/${repo}#${number}`);

  const commits = await res.json();
  return commits
    .map(({ sha, commit }) => ({ sha: sha.slice(0, 7), subject: commit.message.split('\n')[0], problems: validateCommit(commit.message) }))
    .filter((c) => c.problems.length);
}
