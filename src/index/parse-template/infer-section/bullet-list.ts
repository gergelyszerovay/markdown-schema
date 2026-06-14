import { toString } from "mdast-util-to-string";
import type { List } from "mdast";
import type { Extractor } from "../../_shared/extractor";

/**
 * Extracts a plain bullet list from a section into an array of strings.
 *
 * @param nodes - The mdast nodes belonging to the section body.
 * @param ctx - Context carrying the section heading for error messages.
 * @returns An array of trimmed item strings.
 */
export const bulletList: Extractor<string[]> = (nodes, { section }) => {
  const l = nodes.find((n): n is List => n.type === "list");
  if (!l) throw new Error(`Section "${section}" must contain a list`);
  return l.children.map((item) => toString(item).trim());
};
