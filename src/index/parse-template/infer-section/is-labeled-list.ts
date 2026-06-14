import type { List } from "mdast";
import { collectItemDirectives } from "../_shared/collect-item-directives";

/**
 * Returns `true` when at least one item in the list carries a label directive.
 *
 * @param list - The mdast `List` node to inspect.
 * @returns `true` if the list has labeled items with directives, `false` otherwise.
 */
export function isLabeledList(list: List): boolean {
  const directives = collectItemDirectives(list);
  return (
    Object.keys(directives).length > 0 &&
    Object.values(directives).some((d) => d !== null)
  );
}
