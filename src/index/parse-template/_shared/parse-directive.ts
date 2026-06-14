import type { ParsedDirective } from "./parsed-directive";
import { parseEnum } from "./parse-directive/parse-enum";
import { parseField } from "./parse-directive/parse-field";
import { parseFreetextDirective } from "./parse-directive/parse-freetext-directive";
import { parseGuide } from "./parse-directive/parse-guide";
import { parseRowDirective } from "./parse-directive/parse-row-directive";
import { parseSectionDirective } from "./parse-directive/parse-section-directive";
import { extractDirectiveBody } from "./extract-directive-body";
import { DirectiveError } from "./directive-error";

export { extractDirectiveBody };

/**
 * Parses the body of a `<!-- TEMPLATE-ONLY: ... -->` comment into a typed
 * {@link ParsedDirective}.
 *
 * First-token dispatch:
 * - Block directives (`guide`, `row`, `section`) are recognised by their
 *   opening keyword; prose `//` lines inside them are ignored.
 * - Inline directives: after stripping `//`-prose lines, the first token
 *   determines the kind (`enum:` or `string`).
 * - Unrecognised first token → hard {@link DirectiveError}.
 *
 * @param body - Trimmed directive body extracted by {@link extractDirectiveBody}.
 * @param opts - Optional context for error messages.
 * @param opts.position - Source position of the directive opener.
 * @param opts.file - Source file path.
 * @returns A {@link ParsedDirective}.
 */
export function parseDirective(
  body: string,
  opts?: { position?: { line: number; column: number }; file?: string },
): ParsedDirective {
  // Block directives: recognised by opener keyword
  if (
    body === "guide" ||
    body.startsWith("guide\n") ||
    body.startsWith("guide;")
  )
    return parseGuide(body);
  if (body === "row" || body.startsWith("row\n") || body.startsWith("row;"))
    return parseRowDirective(body);
  if (
    body === "section" ||
    body.startsWith("section\n") ||
    body.startsWith("section;")
  )
    return parseSectionDirective(body);
  if (
    body === "freetext" ||
    body.startsWith("freetext\n") ||
    body.startsWith("freetext;")
  )
    return parseFreetextDirective(body);

  // Strip `//`-prose lines for inline directives
  const stripped = body
    .split("\n")
    .filter((l) => !l.trim().startsWith("//"))
    .join("\n")
    .trim();

  // First-token dispatch for inline directives
  const firstToken = stripped.split(/[\s;]/)[0] ?? "";

  if (stripped.startsWith("enum:")) return parseEnum(stripped);
  if (firstToken === "string") return parseField(stripped);

  // Unknown keyword — hard error
  const token = firstToken || stripped.slice(0, 20);
  throw new DirectiveError(`unknown TEMPLATE-ONLY directive kind: '${token}'`, {
    body,
    position: opts?.position,
    file: opts?.file,
  });
}
