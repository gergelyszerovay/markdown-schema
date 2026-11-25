import type { PhrasingContent } from 'mdast';

/**
 * What GFM reads as an autolink literal whose URL differs from its text: a `www.` address
 * and an e-mail address. Escaping does not stop the reader linking them, and `cellText`
 * would then yield the URL, so these spans are written as inline code, which reads back as
 * its exact text. (`http://` and `https://` text is escaped by the serializer and is safe.)
 */
const autolinkLiteral = /\bwww\.\S+|[A-Za-z0-9._+-]+@[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)+/g;

/**
 * Writes a data string as inline content: escaped text, with the spans GFM would turn into
 * autolinks written as inline code so the text reads back unchanged.
 * @param value - The string to write.
 * @returns The inline nodes, in order.
 */
export function writeDataText(value: string): PhrasingContent[] {
  const nodes: PhrasingContent[] = [];
  let from = 0;
  for (const match of value.matchAll(autolinkLiteral)) {
    if (match.index > from) nodes.push({ type: 'text', value: value.slice(from, match.index) });
    nodes.push({ type: 'inlineCode', value: match[0] });
    from = match.index + match[0].length;
  }
  if (from < value.length) nodes.push({ type: 'text', value: value.slice(from) });
  return nodes;
}
