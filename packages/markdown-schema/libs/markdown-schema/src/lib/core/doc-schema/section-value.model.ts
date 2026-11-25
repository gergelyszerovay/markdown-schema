/**
 * What one section of a parsed document holds, by the section's kind in the template's
 * shape (`SectionBodyShape`):
 *
 * - `freetext` → the body as one markdown string;
 * - `table` → one record per row, keyed by column header (a `checkbox` column holds a boolean);
 * - `labeled-list` → one record keyed by label (a blank optional field is `undefined` and
 *   left out of emitted JSON);
 * - `task-list` → one `{ checked, text }` entry per item;
 * - `plain-list` → one string per item;
 * - `repeated-groups` → one `{ heading, items }` entry per H3 group.
 */
export type SectionValue =
  | string
  | string[]
  | Record<string, string | boolean>[]
  | Record<string, string | undefined>
  | { checked: boolean; text: string }[]
  | { heading: string; items: string[] }[];
