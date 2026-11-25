import type { RootContent } from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

/**
 * Parses Markdown as a section body would reach an extractor: GFM enabled, the top-level nodes
 * of the tree.
 * @param md - The Markdown source.
 * @returns The tree's top-level nodes.
 */
export function parseSection(md: string): RootContent[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(md);
  return tree.children;
}
