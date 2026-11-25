import type { ParsedDirective } from '../directive/parsed-directive.model.ts';

/**
 * Returns the first directive of the given kind, or `undefined`.
 * @param directives - Array of parsed directives to search.
 * @param kind - The directive kind to find.
 * @returns The first directive matching `kind`, or `undefined` if none found.
 */
export function findDirective<K extends ParsedDirective['kind']>(
  directives: ParsedDirective[],
  kind: K,
): Extract<ParsedDirective, { kind: K }> | undefined {
  return directives.find((d): d is Extract<ParsedDirective, { kind: K }> => d.kind === kind);
}
