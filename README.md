# check-pr

`check-pr` checks that every commit message in a GitHub pull request follows the
[Conventional Commits](https://www.conventionalcommits.org/) format. It reads the
pull request's commits through the GitHub REST API and reports the messages that
need fixing. It is available as a command-line tool and as a GitHub Action.

**Status:** early development (0.1.0). It is not published to npm.

## How it uses the GitHub API

`check-pr` makes one read-only request per run to the GitHub REST API:

```text
GET https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}/commits?per_page=100
```

- It sends `Accept: application/vnd.github+json` and
  `X-GitHub-Api-Version: 2022-11-28`.
- It sends `Authorization: Bearer <token>` only when a token is configured.
- It writes nothing to GitHub: no comments, statuses or check runs.
- Only the first 100 commits of a pull request are checked.
- Without a token, GitHub's unauthenticated rate limit applies (60 requests per
  hour per IP address), and private repositories return a 404.

## What counts as a valid commit message

The first line must look like `type(scope)!: description`, where the scope and
the `!` are optional, and:

- `type` is one of `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
  `build`, `ci`, `chore`, `revert`.
- the first line is at most 72 characters.
- the description does not end with a period.

Only the first line is validated. The rules live in
[`src/validate.js`](src/validate.js).

## Command-line usage

Requires Node.js 20 or newer. Clone the repository and run:

```sh
git clone https://github.com/aryann2611/check-pr.git
cd check-pr
node bin/check-pr.js <owner>/<repo> <pr-number>
```

For example, `node bin/check-pr.js octocat/hello-world 42`. Set `GITHUB_TOKEN`
to read private repositories or to use the higher authenticated rate limit:

```sh
GITHUB_TOKEN=<token> node bin/check-pr.js <owner>/<repo> <pr-number>
```

The token needs read access to the repository's pull requests.

Exit codes: `0` all messages valid, `1` at least one message needs fixing,
`2` bad arguments or an API error.

Example output:

```text
3f2a1c9 added stuff.
  - header must look like "type(scope)?: description"
1 commit(s) need fixing
```

## GitHub Action usage

Add a workflow that runs on pull requests:

```yaml
name: Commit messages

on:
  pull_request:

permissions:
  contents: read
  pull-requests: read

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: aryann2611/check-pr@main
```

The Action is a composite action that runs `bin/check-pr.js` on the runner, so
the runner needs Node.js 20 or newer. It fails the job when a commit message
needs fixing. This repository's own workflow,
[`commit-messages.yml`](.github/workflows/commit-messages.yml), uses it with
`uses: ./`.

## Configuration

| Setting | Where | Default | Purpose |
| --- | --- | --- | --- |
| `GITHUB_TOKEN` | environment variable (CLI) | none | Token for the API request |
| `token` | Action input | `github.token` | Token for the API request |

The accepted commit types and the 72 character limit are constants in
[`src/validate.js`](src/validate.js) and are not configurable yet.

## Library usage

```js
import { validateCommit, checkPullRequest } from './src/index.js';

validateCommit('wip: save.');
// ['unknown type "wip"', 'description must not end with a period']

await checkPullRequest({ owner: 'octocat', repo: 'hello-world', number: 42 });
// [{ sha: '3f2a1c9', subject: 'added stuff.', problems: [...] }]
```

## Development

```sh
npm ci
npm test
npm run lint
```

The tests inject a fake `fetch`, so they never call the network. CI runs the
tests on Node.js 20, 22 and 24, plus ESLint.

## Support

- Questions and bug reports: [open an issue](https://github.com/aryann2611/check-pr/issues).
- Security problems: use
  [private vulnerability reporting](https://github.com/aryann2611/check-pr/security/advisories/new)
  instead of a public issue. See [SECURITY.md](SECURITY.md).

This is a one-person project, so replies may take a few days.

## License

[MIT](LICENSE)
