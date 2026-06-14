import { DirectiveError } from "./_shared/directive-error";

/**
 * Walks the raw template string and throws {@link DirectiveError} for any
 * structural violation before remark-parse runs:
 *
 * - Inline directive (`<!-- TEMPLATE-ONLY:` preceded by content on the same
 *   line) without `-->` on the same line.
 * - Block directive opener at column ≤ 3 with no content before it, whose
 *   matching `-->` cannot be found.
 *
 * @param raw - Raw template markdown string.
 * @param file - Optional source file path for error messages.
 * @returns Nothing; throws {@link DirectiveError} if a violation is found.
 */
export function validateDirectiveShape(raw: string, file?: string): void {
  const lines = raw.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const openerIdx = line.indexOf("<!-- TEMPLATE-ONLY:");
    if (openerIdx < 0) continue;

    const beforeOpener = line.slice(0, openerIdx).trim();
    const isInline = beforeOpener.length > 0;
    const closesOnSameLine = line.indexOf("-->", openerIdx) > -1;

    const lineNum = i + 1;
    const col = openerIdx + 1;
    const pos = { line: lineNum, column: col };

    if (isInline && !closesOnSameLine) {
      throw new DirectiveError(
        `${file ?? "template.md"}:${lineNum}:${col}: inline TEMPLATE-ONLY directive must close on the same line; "-->" not found before line end`,
        { position: pos, file },
      );
    }

    if (!isInline && !closesOnSameLine) {
      // Block directive — find the closing -->
      let found = false;
      for (let j = i + 1; j < lines.length; j++) {
        if ((lines[j] ?? "").includes("-->")) {
          found = true;
          break;
        }
      }
      if (!found) {
        throw new DirectiveError(
          `${file ?? "template.md"}:${lineNum}:${col}: block TEMPLATE-ONLY directive is unclosed; "-->" not found`,
          { position: pos, file },
        );
      }
    }
  }
}
