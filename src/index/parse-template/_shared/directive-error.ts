/**
 * Thrown when a `<!-- TEMPLATE-ONLY: -->` directive has invalid syntax.
 * The `message` field is formatted as `path:line:col: description` when
 * position information is available, so the CLI formatter needs no changes.
 *
 * @param message - Human-readable error description (may include path:line:col prefix).
 * @param options - Optional context: directive body, source position, and file path.
 */
export class DirectiveError extends Error {
  constructor(
    message: string,
    options?: {
      body?: string;
      position?: { line: number; column: number };
      file?: string;
    },
  ) {
    super(message);
    this.name = "DirectiveError";
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
