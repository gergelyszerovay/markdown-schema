/**
 * Orders two texts by UTF-16 code unit, the same in every environment (unlike a locale
 * comparison).
 * @param left - The first text.
 * @param right - The second text.
 * @returns A negative number, zero or a positive number, for `Array.prototype.sort`.
 */
export function compareText(left: string, right: string): number {
  if (left < right) return -1;
  return left > right ? 1 : 0;
}
