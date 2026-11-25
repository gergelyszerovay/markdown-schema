import type { Blockquote, Root } from 'mdast';
import { extractDirectiveBody } from '../directive/extract-directive-body.rules.ts';
import { parseDirective } from '../directive/parse-directive.rules.ts';
import { DirectiveError } from '../directive/directive.error.ts';
import type { SummaryShape } from './template-shape.model.ts';

/**
 * Lists the html comment values of a blockquote: the comment is a block html node when it
 * is the blockquote's whole line (`> <!-- ... -->`), and an inline html child of a
 * paragraph when text surrounds it.
 * @param blockquote - The blockquote node to read.
 * @returns The html values, in order.
 */
function blockquoteHtmlValues(blockquote: Blockquote): string[] {
  const values: string[] = [];
  for (const child of blockquote.children) {
    if (child.type === 'html') values.push(child.value);
    if (child.type === 'paragraph') {
      for (const inline of child.children) {
        if (inline.type === 'html') values.push(inline.value);
      }
    }
  }
  return values;
}

/**
 * Infers the template's summary shape: a blockquote between the title and the first
 * section whose text is an inline `TEMPLATE-ONLY` field directive, with an optional regex
 * modifier. A template without such a blockquote declares no summary, and documents are
 * parsed as before.
 * @param tree - The template's mdast tree.
 * @param sectionDepth - The heading depth that opens a section.
 * @param file - Optional source file path for error messages.
 * @returns The summary's shape, or `undefined` when the template declares none.
 */
export function inferSummaryShape(
  tree: Root,
  sectionDepth: number,
  file?: string,
): SummaryShape | undefined {
  let found: SummaryShape | undefined;
  for (const node of tree.children) {
    if (node.type === 'heading' && node.depth === sectionDepth) break;
    if (node.type !== 'blockquote') continue;
    for (const value of blockquoteHtmlValues(node)) {
      const body = extractDirectiveBody(value);
      if (body === null) continue;
      const directive = parseDirective(body, { file });
      if (directive.kind !== 'field') {
        throw new DirectiveError(
          `the summary blockquote under the title only supports an inline field directive, got: ${directive.kind}`,
          { body, file },
        );
      }
      if (found) {
        throw new DirectiveError('a template may declare only one summary directive', {
          body,
          file,
        });
      }
      found = { kind: 'field', required: directive.required, pattern: directive.regex };
    }
  }
  return found;
}
