import { toString } from "mdast-util-to-string";
import type { List, ListItem } from "mdast";
import type { Extractor } from "../../_shared/extractor";

/**
 * Extracts a GFM task list (`- [ ]` / `- [x]`) from a section.
 *
 * @param nodes - The mdast nodes belonging to the section body.
 * @param ctx - Context carrying the section heading for error messages.
 * @returns An array of `{ checked, text }` objects.
 */
export const taskList: Extractor<{ checked: boolean; text: string }[]> = (
  nodes,
  { section },
) => {
  const list = nodes.find((n): n is List => n.type === "list");
  if (!list) throw new Error(`Section "${section}" must contain a list`);
  return list.children.map((item: ListItem) => ({
    checked: item.checked ?? false,
    text: toString(item).trim(),
  }));
};
