import { toString } from 'mdast-util-to-string';
import type { RootContent } from 'mdast';

/**
 * Extracts the document's summary: the text of the first blockquote among the preamble
 * nodes (between the title and the first section). Soft line breaks inside the blockquote
 * are folded into single spaces, so a wrapped one-sentence summary stays one line.
 * @param preamble - The document's preamble nodes, as `splitDoc` returns them.
 * @returns The summary text, or `undefined` when the preamble has no blockquote.
 */
export function extractSummary(preamble: RootContent[]): string | undefined {
  const blockquote = preamble.find((node) => node.type === 'blockquote');
  if (!blockquote) return undefined;
  return toString(blockquote)
    .replace(/\s*\n\s*/g, ' ')
    .trim();
}
