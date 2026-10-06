const HEADER = /^(?<type>[A-Za-z]+)(?:\((?<scope>[^()\s][^()]*)\))?(?<bang>!)?: (?<description>\S.*)$/;
const FOOTER = /^(?<token>BREAKING[ -]CHANGE|[A-Za-z][A-Za-z-]*)(?:: | #)(?<value>.*)$/;

/**
 * Parse a Conventional Commit message.
 * @param {string} message
 * @throws {TypeError} when message is not a string
 * @returns {{type: string, scope: string|null, breaking: boolean,
 *   description: string, body: string, footers: {token: string, value: string}[]}|null}
 *   null when the header does not conform.
 */
export function parseCommit(message) {
  if (typeof message !== 'string') throw new TypeError('commit message must be a string');
  const [header, ...rest] = message.replace(/\r\n/g, '\n').trim().split('\n');
  const m = HEADER.exec(header);
  if (!m) return null;

  const paragraphs = rest.join('\n').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  // ponytail: footer values must be single-line; multi-line footer values are not supported
  const last = paragraphs.at(-1);
  const footerLines = last?.split('\n').map((l) => FOOTER.exec(l));
  const footers = footerLines?.every(Boolean)
    ? footerLines.map((f) => ({ token: f.groups.token, value: f.groups.value }))
    : [];
  if (footers.length) paragraphs.pop();

  return {
    type: m.groups.type,
    scope: m.groups.scope ?? null,
    breaking: Boolean(m.groups.bang) || footers.some((f) => /^BREAKING[ -]CHANGE$/.test(f.token)),
    description: m.groups.description,
    body: paragraphs.join('\n\n'),
    footers,
  };
}
