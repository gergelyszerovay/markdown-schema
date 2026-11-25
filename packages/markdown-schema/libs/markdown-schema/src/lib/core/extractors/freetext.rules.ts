import { toMarkdown } from 'mdast-util-to-markdown';
import { gfmToMarkdown } from 'mdast-util-gfm';
import type { Root } from 'mdast';
import type { Extractor } from './extractor.model.ts';
import { extractDirectiveBody } from '../directive/extract-directive-body.rules.ts';

/**
 * Serializes a section's body nodes back to a markdown string, preserving all
 * node types (paragraphs, code, lists, tables, blockquotes, thematic breaks,
 * H3+ headings, etc.).
 *
 * Throws if any TEMPLATE-ONLY directive is found nested inside the body.
 * @param nodes - The mdast nodes belonging to the section body.
 * @param props - Extractor context with the section heading name.
 * @returns The section body serialized to a trimmed markdown string.
 */
export const freetext: Extractor<string> = (nodes, { section }) => {
  const hasNestedDirective = (n: unknown): boolean => {
    if (typeof n !== 'object' || n === null) return false;
    const node = n as { type: string; value?: string; children?: unknown[] };
    if (node.type === 'html' && typeof node.value === 'string') {
      if (extractDirectiveBody(node.value) !== null) return true;
    }
    if (Array.isArray(node.children)) {
      return node.children.some(hasNestedDirective);
    }
    return false;
  };

  for (const n of nodes) {
    if (hasNestedDirective(n)) {
      throw new Error(
        `Section "${section}": free-text bodies cannot contain TEMPLATE-ONLY directives`,
      );
    }
  }

  const root: Root = { type: 'root', children: nodes };
  return toMarkdown(root, { extensions: [gfmToMarkdown()] }).trim();
};
