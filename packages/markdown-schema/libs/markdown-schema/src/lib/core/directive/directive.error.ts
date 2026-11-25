/**
 * Thrown when a `<!-- TEMPLATE-ONLY: -->` directive has invalid syntax.
 *
 * When a source `position` is supplied, the constructor prefixes the message
 * with `path:line:col:` (using `file`, or `template.md` when absent), so every
 * throw site gets a located message without pre-formatting it by hand. Throw
 * sites that have no position produce an unprefixed message.
 * @param description - Human-readable error description (without location prefix).
 * @param options - Optional context: directive body, source position, and file path.
 */
export class DirectiveError extends Error {
  constructor(
    description: string,
    options?: {
      body?: string;
      position?: { line: number; column: number };
      file?: string;
    },
  ) {
    const pos = options?.position;
    const prefix = pos
      ? `${options.file ?? 'template.md'}:${String(pos.line)}:${String(pos.column)}: `
      : '';
    super(prefix + description);
    this.name = 'DirectiveError';
    this.body = options?.body;
    this.position = options?.position;
    this.file = options?.file;
  }
  /** The raw directive body that triggered the error, if available. */
  readonly body?: string;
  /** Source position of the directive opener, if available. */
  readonly position?: { line: number; column: number };
  /** Source file path, if available. */
  readonly file?: string;
}
