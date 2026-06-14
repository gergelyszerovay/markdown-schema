import type { ColumnSpec } from "../../parsed-directive";
import { splitEscapedChoices } from "../_shared/split-escaped-choices";

/**
 * Parses a semicolon-separated column-spec string into a {@link ColumnSpec}.
 *
 * Column spec grammar (mirrors the inline field grammar):
 * `string; required`
 * `string; regex \`^[A-Z]+$\`; required`
 * `enum: A | B | C; required`
 *
 * @param spec - Semicolon-separated spec string, e.g. `"string; required"`.
 * @returns A {@link ColumnSpec} describing the column's constraints.
 */
export function parseColumnSpec(spec: string): ColumnSpec {
  const parts = spec.split(";").map((s) => s.trim());
  let required = true;
  let regex: string | undefined;
  let enumChoices: string[] | undefined;
  let defaultValue: string | undefined;

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
    } else if (part.startsWith("enum:")) {
      enumChoices = splitEscapedChoices(part.slice("enum:".length).trim());
    } else if (part.startsWith("default=")) {
      defaultValue = part
        .slice("default=".length)
        .replace(/^["']/, "")
        .replace(/["']$/, "");
    }
  }

  return { required, regex, enumChoices, defaultValue };
}
