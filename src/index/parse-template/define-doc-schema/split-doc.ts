import { toString } from "mdast-util-to-string";
import type { Root, RootContent } from "mdast";
import { extractFrontmatter } from "./split-doc/extract-frontmatter";

/**
 * Splits an mdast tree into a title string and a map of section heading →
 * body nodes.
 *
 * @param tree - The parsed mdast Root node.
 * @param opts - Split options.
 * @param opts.titleDepth - Heading depth treated as the document title.
 *   `undefined` means no title extraction.
 * @param opts.sectionDepth - Heading depth treated as section boundaries.
 * @returns An object with `frontmatter` (parsed YAML frontmatter, or
 *   `undefined` when absent), `title` (empty string when absent), and
 *   `sections` map from heading text to body nodes.
 */
export function splitDoc(
  tree: Root,
  opts: { titleDepth: number | undefined; sectionDepth: number },
): {
  frontmatter: unknown;
  title: string;
  sections: Map<string, RootContent[]>;
} {
  const frontmatter = extractFrontmatter(tree);
  let title = "";
  const sections = new Map<string, RootContent[]>();
  let current: string | null = null;

  for (const node of tree.children) {
    if (
      opts.titleDepth !== undefined &&
      !title &&
      node.type === "heading" &&
      node.depth === opts.titleDepth
    ) {
      title = toString(node).trim();
      continue;
    }
    if (node.type === "heading" && node.depth === opts.sectionDepth) {
      current = toString(node).trim();
      sections.set(current, []);
      continue;
    }
    if (current) sections.get(current)!.push(node);
  }
  return { frontmatter, title, sections };
}
