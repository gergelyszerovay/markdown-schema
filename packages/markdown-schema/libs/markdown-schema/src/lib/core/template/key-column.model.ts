/** A table column whose values identify the rows of a document, declared with the `key` modifier. */
export type KeyColumn = {
  /** The section's key, derived from its heading. */
  section: string;
  /** The section's heading text. */
  heading: string;
  /** The column's header text. */
  column: string;
};
