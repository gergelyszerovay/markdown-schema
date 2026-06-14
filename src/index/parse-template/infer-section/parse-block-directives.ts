import type { RootContent } from "mdast";
import {
  extractDirectiveBody,
  parseDirective,
} from "../_shared/parse-directive";
import type { ParsedDirective } from "../_shared/parsed-directive";
import { blockHtmlNodes } from "./parse-block-directives/block-html-nodes";

/**
 * Parses all block directives from a section body.
 *
 * @param nodes - Flat list of mdast content nodes for the section.
 * @returns An array of all recognised {@link ParsedDirective} objects found in block HTML comments.
 */
export function parseBlockDirectives(nodes: RootContent[]): ParsedDirective[] {
  const result: ParsedDirective[] = [];
  for (const n of blockHtmlNodes(nodes)) {
    const body = extractDirectiveBody(n.value);
    if (!body) continue;
    const d = parseDirective(body);
    if (d) result.push(d);
  }
  return result;
}
