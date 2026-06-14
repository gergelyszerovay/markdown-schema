import type { ParsedDirective } from "../parsed-directive";
import { DirectiveError } from "../directive-error";

/**
 * Parses the body of a `freetext` block directive.
 *
 * All modifiers live on the opener line, semicolon-separated:
 * `freetext; optional`
 * `freetext; required`
 *
 * @param body - Trimmed directive body starting with `freetext`.
 * @returns A `freetext` ParsedDirective.
 */
export function parseFreetextDirective(
  body: string,
): ParsedDirective & { kind: "freetext" } {
  const allLines = body.split("\n");
  const openerLine = allLines[0] ?? "";
  const bodyLines = allLines.slice(1);

  // Body lines (non-blank, non-//) are an error
  for (const line of bodyLines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    if (trimmed.startsWith("//")) continue;
    throw new DirectiveError(
      `freetext modifiers must be on the directive opener, not in the body; found: "${trimmed}"`,
      { body },
    );
  }

  const parts = openerLine
    .slice("freetext".length)
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  let optional = false;

  for (const part of parts) {
    if (part === "optional") {
      optional = true;
    } else if (part === "required") {
      // no-op; default
    } else {
      throw new DirectiveError(`unknown freetext modifier: '${part}'`, {
        body,
      });
    }
  }

  return { kind: "freetext", optional };
}
