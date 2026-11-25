import type { Code } from 'mdast';
import type { Extractor } from './extractor.model.ts';

/**
 * Collects all fenced code blocks in a section.
 * @param nodes - The mdast nodes belonging to the section body.
 * @returns An array of `{ lang, value }` objects; `lang` is `null` when the
 *   fence has no language specifier.
 */
export const codeBlocks: Extractor<{ lang: string | null; value: string }[]> = (nodes) =>
  nodes
    .filter((n): n is Code => n.type === 'code')
    .map((n) => ({ lang: n.lang ?? null, value: n.value }));
