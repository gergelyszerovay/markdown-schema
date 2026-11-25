import type { Root } from 'mdast';
import { gfmToMarkdown } from 'mdast-util-gfm';
import { toMarkdown } from 'mdast-util-to-markdown';

/**
 * Marks a table cell the data leaves out. The serializer pads every row to the header's
 * width, so `buildDocumentTree` writes the sentinel into an absent trailing cell and
 * `serializeTree` removes it again, leaving a row with fewer cells than headers.
 */
export const absentCell = '\u0000absent\u0000';

/**
 * Writes a document tree as markdown: `-` bullets, ATX headings, and GFM tables written
 * unaligned, so alignment stays the consumer's formatter's job. A table cell the tree marks
 * with {@link absentCell} is dropped, so a row may have fewer cells than the header.
 * @param tree - The document's tree, from `buildDocumentTree`.
 * @returns The markdown text, ending with one newline.
 */
export function serializeTree(tree: Root): string {
  const markdown = toMarkdown(tree, {
    bullet: '-',
    extensions: [gfmToMarkdown({ tablePipeAlign: false })],
  });
  return markdown.replaceAll(` ${absentCell} |`, '');
}
