/** One row key of a parsed document, and the row it identifies. */
export type RowKey = {
  /** The key value, such as `D26`. */
  key: string;
  /** The section's key, derived from its heading. */
  section: string;
  /** The column that holds the key. */
  column: string;
  /** Where the row sits, as `section[key]`. */
  field: string;
};
