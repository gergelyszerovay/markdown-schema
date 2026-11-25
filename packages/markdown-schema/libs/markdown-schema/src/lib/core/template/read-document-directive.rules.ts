import type { Root } from 'mdast';
import { extractDirectiveBody } from '../directive/extract-directive-body.rules.ts';
import { parseDirective } from '../directive/parse-directive.rules.ts';
import { DirectiveError } from '../directive/directive.error.ts';

/** What the template's `document` directive switches on. */
export type DocumentOptions = { open: boolean; unordered: boolean };

/**
 * Reads the template's document-level directive: the `document` block directive among the
 * nodes before the first `##` heading (the title and its preamble). Other directives there,
 * such as `guide`, are ignored.
 * @param tree - The template's mdast tree.
 * @param sectionDepth - The heading depth that opens a section.
 * @param file - Optional source file path for error messages.
 * @returns The document options; both `false` when the template has no `document` directive.
 */
export function readDocumentDirective(
  tree: Root,
  sectionDepth: number,
  file?: string,
): DocumentOptions {
  let found: DocumentOptions | undefined;
  for (const node of tree.children) {
    if (node.type === 'heading' && node.depth === sectionDepth) break;
    if (node.type !== 'html') continue;
    const body = extractDirectiveBody(node.value);
    if (body === null) continue;
    const directive = parseDirective(body, { file });
    if (directive.kind !== 'document') continue;
    if (found) {
      throw new DirectiveError('a template may declare only one document directive', {
        body,
        file,
      });
    }
    found = { open: directive.open, unordered: directive.unordered };
  }
  return found ?? { open: false, unordered: false };
}
