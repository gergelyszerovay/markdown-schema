import type { ParsedDirective } from "../parsed-directive";
import { DirectiveError } from "../directive-error";

/**
 * Parses the body of a `section` block directive.
 *
 * All modifiers live on the opener line, semicolon-separated:
 * `section; optional; remove-if Type=View`
 * `section; min-groups: 1; max-groups: 10`
 *
 * @param body - Trimmed directive body starting with `section`.
 * @returns A `section` ParsedDirective.
 */
export function parseSectionDirective(
  body: string,
): ParsedDirective & { kind: "section" } {
  const allLines = body.split("\n");
  const openerLine = allLines[0] ?? "";
  const bodyLines = allLines.slice(1);

  // Body lines (non-blank, non-//) are a migration error
  for (const line of bodyLines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    if (trimmed.startsWith("//")) continue;
    throw new DirectiveError(
      `section modifiers must be on the directive opener, not in the body; found: "${trimmed}"`,
      { body },
    );
  }

  const parts = openerLine
    .slice("section".length)
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  let optional = false;
  let removeIf: { key: string; value: string } | undefined;
  let minGroups: number | undefined;
  let maxGroups: number | undefined;

  for (const part of parts) {
    if (part === "optional") {
      optional = true;
    } else if (part.startsWith("remove-if ")) {
      const rest = part.slice("remove-if ".length);
      const eqIdx = rest.indexOf("=");
      if (eqIdx > -1) {
        removeIf = {
          key: rest.slice(0, eqIdx).trim(),
          value: rest.slice(eqIdx + 1).trim(),
        };
      }
    } else if (part.startsWith("min-groups:")) {
      minGroups = parseInt(part.slice("min-groups:".length).trim(), 10);
    } else if (part.startsWith("max-groups:")) {
      maxGroups = parseInt(part.slice("max-groups:".length).trim(), 10);
    }
  }

  return { kind: "section", optional, removeIf, minGroups, maxGroups };
}
