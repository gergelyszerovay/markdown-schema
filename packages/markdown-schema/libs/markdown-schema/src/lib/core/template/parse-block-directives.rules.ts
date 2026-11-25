import type { RootContent } from 'mdast';
import { extractDirectiveBody } from '../directive/extract-directive-body.rules.ts';
import { parseDirective } from '../directive/parse-directive.rules.ts';
import type { ParsedDirective } from '../directive/parsed-directive.model.ts';
import { blockHtmlNodes } from './block-html-nodes.rules.ts';

/**
 * Parses all block directives from a section body.
 * @param nodes - Flat list of mdast content nodes for the section.
 * @returns An array of all recognised {@link ParsedDirective} objects found in block HTML comments.
 */
export function parseBlockDirectives(nodes: RootContent[]): ParsedDirective[] {
  const result: ParsedDirective[] = [];
  for (const n of blockHtmlNodes(nodes)) {
    const body = extractDirectiveBody(n.value);
    if (!body) continue;
    result.push(parseDirective(body));
  }
  return result;
}
