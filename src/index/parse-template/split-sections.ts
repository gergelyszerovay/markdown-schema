import type { Root, RootContent } from "mdast";
import { toString } from "mdast-util-to-string";
import { extractDirectiveBody } from "./_shared/extract-directive-body";
import { DirectiveError } from "./_shared/directive-error";

/**
 * Splits the document into section bodies by H2 headings, preserving order.
 * Returns a map of heading text → body nodes.
 *
 * H2 headings must not carry inline `TEMPLATE-ONLY` directives — those belong
 * in H1 (title) or H3 (per-group heading inside repeated sections). Throws
 * {@link DirectiveError} if an H2 heading carries such a directive.
 *
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
  let current: string | null = null;
  let titleSeen = false;

  for (const node of tree.children) {
    if (node.type === "heading" && node.depth === titleDepth && !titleSeen) {
      titleSeen = true;
      continue;
    }
    if (node.type === "heading" && node.depth === sectionDepth) {
      // Reject inline TEMPLATE-ONLY directives in H2 headings
      for (const child of node.children) {
        if (child.type === "html") {
          const body = extractDirectiveBody(child.value);
          if (body !== null) {
            const pos = node.position?.start;
            throw new DirectiveError(
              `H2 headings cannot carry inline TEMPLATE-ONLY directives — only H1 (title) and H3 (per-group heading inside repeated sections) support inline directives`,
              {
                body,
                position: pos
                  ? { line: pos.line, column: pos.column }
                  : undefined,
              },
            );
          }
        }
      }
      current = toString(node).trim();
      sections.set(current, []);
      continue;
    }
    if (current !== null) {
      sections.get(current)!.push(node);
    }
  }
  return sections;
}
