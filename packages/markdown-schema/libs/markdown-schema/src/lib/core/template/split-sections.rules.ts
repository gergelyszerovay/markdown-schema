import type { Root, RootContent } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { extractDirectiveBody } from '../directive/extract-directive-body.rules.ts';
import { DirectiveError } from '../directive/directive.error.ts';

/**
 * Splits the document into section bodies by H2 headings, preserving order.
 * Returns a map of heading text → body nodes.
 *
 * H2 headings must not carry inline `TEMPLATE-ONLY` directives — those belong
 * in H1 (title) or H3 (per-group heading inside repeated sections). Throws
 * {@link DirectiveError} if an H2 heading carries such a directive.
 * @param tree - The mdast Root node to split.
 * @param titleDepth - The heading depth used for the document title (skipped).
 * @param sectionDepth - The heading depth used for section boundaries.
 * @returns A map from section heading text to the body nodes of that section.
 */
export function splitSections(
  tree: Root,
  titleDepth: number,
  sectionDepth: number,
): Map<string, RootContent[]> {
  const sections = new Map<string, RootContent[]>();
  let currentNodes: RootContent[] | null = null;
  let titleSeen = false;

  for (const node of tree.children) {
    if (node.type === 'heading' && node.depth === titleDepth && !titleSeen) {
      titleSeen = true;
      continue;
    }
    if (node.type === 'heading' && node.depth === sectionDepth) {
      // Reject inline TEMPLATE-ONLY directives in H2 headings
      for (const child of node.children) {
        if (child.type === 'html') {
          const body = extractDirectiveBody(child.value);
          if (body !== null) {
            const pos = node.position?.start;
            throw new DirectiveError(
              `H2 headings cannot carry inline TEMPLATE-ONLY directives — only H1 (title) and H3 (per-group heading inside repeated sections) support inline directives`,
              {
                body,
                position: pos ? { line: pos.line, column: pos.column } : undefined,
              },
            );
          }
        }
      }
      const heading = toString(node).trim();
      if (sections.has(heading)) {
        const pos = node.position?.start;
        throw new DirectiveError(`duplicate H2 heading "${heading}" in template`, {
          position: pos ? { line: pos.line, column: pos.column } : undefined,
        });
      }
      currentNodes = [];
      sections.set(heading, currentNodes);
      continue;
    }
    if (currentNodes !== null) {
      currentNodes.push(node);
    }
  }
  return sections;
}
