import type { ParsedDirective } from "../parsed-directive";

/**
 * Parses the body of a field directive.
 *
 * Expected form (semicolon-separated modifiers):
 * `string; required`
 * `string; optional; only-if Type=Primitive`
 * `string; regex \`^[a-z]+$\`; required`
 *
 * The `regex` modifier must follow `string` — bare `regex \`...\`` without
 * a leading `string` token is rejected by the dispatcher before this function
 * is called.
 *
 * @param body - Trimmed directive body starting with `string`.
 * @returns A `field` ParsedDirective.
 */
export function parseField(body: string): ParsedDirective & { kind: "field" } {
  const parts = body.split(";").map((s) => s.trim());
  let required = true;
  let regex: string | undefined;
  let defaultValue: string | undefined;
  let onlyIf: { key: string; value: string } | undefined;

  for (const part of parts) {
    if (part === "string") {
      // type token — present but carries no extra info
    } else if (part === "optional") {
      required = false;
    } else if (part === "required") {
      required = true;
    } else if (part.startsWith("regex")) {
      const m = part.match(/`([^`]+)`/);
      if (m) regex = m[1];
    } else if (part.startsWith("default=")) {
      defaultValue = part
        .slice("default=".length)
        .replace(/^["']/, "")
        .replace(/["']$/, "");
    } else if (part.startsWith("only-if ")) {
      const rest = part.slice("only-if ".length);
      const eqIdx = rest.indexOf("=");
      if (eqIdx > -1) {
        onlyIf = {
          key: rest.slice(0, eqIdx).trim(),
          value: rest.slice(eqIdx + 1).trim(),
        };
      }
    }
    // example= modifiers are ignored (documentation only)
  }

  return { kind: "field", required, regex, defaultValue, onlyIf };
}
