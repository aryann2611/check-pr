import { parseCommit } from './parse.js';

export const TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];
const MAX_HEADER = 72;

/**
 * Validate a Conventional Commit message.
 * @param {string} message
 * @returns {string[]} problems; empty when the message is valid.
 */
export function validateCommit(message) {
  const commit = parseCommit(message);
  if (!commit) return ['header must look like "type(scope)?: description"'];

  const problems = [];
  const header = message.trim().split('\n')[0];
  if (!TYPES.includes(commit.type)) problems.push(`unknown type "${commit.type}"`);
  if (header.length > MAX_HEADER) problems.push(`header is ${header.length} characters, max ${MAX_HEADER}`);
  if (commit.description.endsWith('.')) problems.push('description must not end with a period');
  return problems;
}
