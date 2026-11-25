import type { List } from 'mdast';

/**
 * Returns `true` when at least one list item has a checked/unchecked state.
 * @param list - The mdast `List` node to inspect.
 * @returns `true` if any item has a `checked` property set, `false` otherwise.
 */
export function isTaskList(list: List): boolean {
  return list.children.some((item) => item.checked !== null && item.checked !== undefined);
}
