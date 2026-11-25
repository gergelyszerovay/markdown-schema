import { toString } from 'mdast-util-to-string';
import type { Table } from 'mdast';
import type { Extractor } from './extractor.model.ts';
import { cellText } from './cell-text.rules.ts';

/**
 * Parses the first GFM table in a section into an array of row objects keyed
 * by header cell text.
 * @param nodes - The mdast nodes belonging to the section body.
 * @param ctx - Context carrying the section heading for error messages.
 * @returns An array where each entry maps header text to cell text.
 */
export const table: Extractor<Record<string, string>[]> = (nodes, { section }) => {
  const t = nodes.find((n): n is Table => n.type === 'table');
  if (!t) throw new Error(`Section "${section}" must contain a table`);
  const [head, ...body] = t.children;
  const headers = (head?.children ?? []).map((c) => toString(c).trim());
  return body.map((row) => {
    // Null-prototype object: header text is untrusted, so a header literally
    // named `__proto__`/`constructor` is stored as an ordinary key instead of
    // hitting the prototype setter (no pollution, no silently-dropped value).
    const obj = Object.create(null) as Record<string, string>;
    // Body cells use cellText so doc-path citations written as Markdown links
    // `[label](path)` yield the URL (header cells keep toString: header text is
    // a label, never a citation).
    row.children.forEach((cell, i) => (obj[String(headers[i])] = cellText(cell).trim()));
    return obj;
  });
};
