import type { ParsedDirective } from './parsed-directive.model.ts';
import { DirectiveError } from './directive.error.ts';

/**
 * Parses the body of a `document` block directive, the template's document-level directive.
 *
 * All modifiers live on the opener line, semicolon-separated:
 * `document; open; unordered`
 * - `open`: a `##` section the template does not declare is accepted and parsed as free text.
 * - `unordered`: the declared sections may appear in any order.
 * @param body - Trimmed directive body starting with `document`.
 * @returns A `document` ParsedDirective.
 */
export function parseDocumentDirective(body: string): ParsedDirective & { kind: 'document' } {
  const allLines = body.split('\n');
  const openerLine = allLines[0] ?? '';

  for (const line of allLines.slice(1)) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('//')) continue;
    throw new DirectiveError(
      `document modifiers must be on the directive opener, not in the body; found: "${trimmed}"`,
      { body },
    );
  }

  const parts = openerLine
    .slice('document'.length)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  let open = false;
  let unordered = false;
  for (const part of parts) {
    if (part === 'open') open = true;
    else if (part === 'unordered') unordered = true;
    else throw new DirectiveError(`unknown document modifier: '${part}'`, { body });
  }

  return { kind: 'document', open, unordered };
}
