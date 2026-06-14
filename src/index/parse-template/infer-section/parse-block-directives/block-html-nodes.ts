import type { RootContent, Html } from "mdast";

/**
 * Returns all block-level html nodes from a flat node list.
 *
 * @param nodes - Flat list of mdast content nodes.
 * @returns An array containing only the `Html` nodes from `nodes`.
 */
export function blockHtmlNodes(nodes: RootContent[]): Html[] {
  return nodes.filter((n): n is Html => n.type === "html");
}
