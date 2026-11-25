import { toString } from 'mdast-util-to-string';
import type { Root, RootContent } from 'mdast';
import { extractFrontmatter } from './extract-frontmatter.rules.ts';

/**
 * Splits an mdast tree into a title string and a map of section heading →
 * body nodes.
 * @param tree - The parsed mdast Root node.
 * @param opts - Split options. `titleDepth`: heading depth treated as the document title. `undefined` means no title extraction. `sectionDepth`: heading depth treated as section boundaries.
 * @returns An object with `frontmatter` (parsed YAML frontmatter, or
 *   `undefined` when absent), `title` (empty string when absent), `preamble`
 *   (the nodes before the first section that are not the title, among them the
 *   `>` summary blockquote, so the summary extractor can read it), and
 *   `sections` map from heading text to body nodes.
 */
export function splitDoc(
  tree: Root,
  opts: { titleDepth: number | undefined; sectionDepth: number },
): {
  frontmatter: unknown;
  title: string;
  preamble: RootContent[];
  sections: Map<string, RootContent[]>;
} {
  const frontmatter = extractFrontmatter(tree);
  let title = '';
  const preamble: RootContent[] = [];
  const sections = new Map<string, RootContent[]>();
  let currentNodes: RootContent[] | null = null;

  for (const node of tree.children) {
    if (
      opts.titleDepth !== undefined &&
      !title &&
      node.type === 'heading' &&
      node.depth === opts.titleDepth
    ) {
      title = toString(node).trim();
      continue;
    }
    if (node.type === 'heading' && node.depth === opts.sectionDepth) {
      const heading = toString(node).trim();
      // Duplicate H2 text would last-wins overwrite, silently dropping the
      // first section's content from validation and output.
      if (sections.has(heading)) {
        throw new Error(`Duplicate section heading: "${heading}"`);
      }
      currentNodes = [];
      sections.set(heading, currentNodes);
      continue;
    }
    // Track the section's node list (not its heading text) so an empty-text H2 still
    // collects its body nodes.
    if (currentNodes !== null) currentNodes.push(node);
    else preamble.push(node);
  }
  return { frontmatter, title, preamble, sections };
}
