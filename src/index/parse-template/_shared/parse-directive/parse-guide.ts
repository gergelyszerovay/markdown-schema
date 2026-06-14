import type { ParsedDirective } from "../parsed-directive";
import { DirectiveError } from "../directive-error";

/**
 * Parses the body of a `guide` block directive.
 *
 * A guide block may contain only blank lines and `//`-prefixed prose lines.
 * Any other non-blank line is a hard error.
 *
 * @param body - Trimmed directive body starting with `guide`.
 * @returns A `guide` ParsedDirective (carries no semantic data).
 */
export function parseGuide(body: string): ParsedDirective & { kind: "guide" } {
  const lines = body.split("\n").slice(1);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    if (trimmed.startsWith("//")) continue;
    throw new DirectiveError(
      `guide block: line must start with '//' or be blank; got: "${trimmed}"`,
      { body },
    );
  }
  return { kind: "guide" };
}
