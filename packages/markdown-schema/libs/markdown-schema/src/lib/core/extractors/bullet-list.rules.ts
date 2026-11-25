import type { List } from 'mdast';
import type { Extractor } from './extractor.model.ts';
import { cellText } from './cell-text.rules.ts';

/**
 * Extracts a plain bullet list from a section into an array of strings.
 * @param nodes - The mdast nodes belonging to the section body.
 * @param ctx - Context carrying the section heading for error messages.
 * @returns An array of trimmed item strings.
 */
export const bulletList: Extractor<string[]> = (nodes, { section }) => {
  const l = nodes.find((n): n is List => n.type === 'list');
  if (!l) throw new Error(`Section "${section}" must contain a list`);
  return l.children.map((item) => cellText(item).trim());
};
