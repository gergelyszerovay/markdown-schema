/**
 * Converts a section heading into a camelCase key.
 *
 * Words are split on whitespace AND hyphens, so headings that contain
 * either separator produce the same camelCase shape.
 *
 * Examples:
 * - `"1. Summary"` → `"summary"`
 * - `"4. Inputs (Props)"` → `"inputs"`
 * - `"8. Visual States"` → `"visualStates"`
 * - `"7. Internal State"` → `"internalState"`
 * - `"5. Slots / Content Projection"` → `"slots"`
 * - `"Cross-Domain"` → `"crossDomain"`
 * @param heading - The raw section heading text to convert.
 * @returns A camelCase key derived from the heading.
 */
export function headingToKey(heading: string): string {
  // Strip leading numbering like "1." or "3.2"
  const withoutNumber = heading.replace(/^\d+(\.\d+)*\.\s*/, '');
  // Strip parenthetical suffixes and slash-separated parts
  const cleaned = withoutNumber
    .replace(/\s*\(.*\)\s*$/, '')
    .replace(/\s*\/.*$/, '')
    .trim();
  // CamelCase from words: split on whitespace AND hyphens so `Cross-Domain`
  // and `Cross Domain` both yield `crossDomain`.
  const words = cleaned.split(/[\s-]+/).filter(Boolean);
  if (words.length === 0) return heading.toLowerCase();
  const [first = '', ...rest] = words;
  return (
    first.toLowerCase() +
    rest.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')
  );
}
