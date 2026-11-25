import type { List, Paragraph } from 'mdast';
import { extractDirectiveBody } from './extract-directive-body.rules.ts';
import { parseDirective } from './parse-directive.rules.ts';
import type { ParsedDirective } from './parsed-directive.model.ts';

/**
 * Collects inline `enum` / `field` directives from the html children of
 * list items, keyed by the label prefix text of each item.
 * @param list - The mdast `List` node to inspect.
 * @returns A record mapping label text to the parsed directive (or `null` if none).
 */
export function collectItemDirectives(list: List): Record<string, ParsedDirective | null> {
  const result: Record<string, ParsedDirective | null> = {};

  for (const item of list.children) {
    // Find the first paragraph in the list item
    const para = item.children.find((c): c is Paragraph => c.type === 'paragraph');
    if (!para) continue;

    // Label: the text of the first text-like node before any html comment
    let label = '';
    let directive: ParsedDirective | null = null;

    for (const child of para.children) {
      if (child.type === 'text') {
        label += child.value;
      } else if (child.type === 'html') {
        const body = extractDirectiveBody(child.value);
        if (body) {
          directive = parseDirective(body);
        }
      } else if (child.type === 'inlineCode') {
        // Ignore inline code examples
      }
    }

    const colonIdx = label.indexOf(':');
    if (colonIdx > -1) {
      const key = label.slice(0, colonIdx).trim();
      if (key) result[key] = directive;
    }
  }

  return result;
}
