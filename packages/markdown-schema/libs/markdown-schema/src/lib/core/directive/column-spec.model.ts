/** A column specification within a `row` directive. */
export type ColumnSpec = {
  /** Whether the column must be non-empty. */
  required: boolean;
  /** Whether the column's values identify the rows of the document (the `key` modifier). */
  key: boolean;
  /** Regular-expression string when the value must match a pattern. */
  regex?: string;
  /** Allowed values when the column has a fixed choice list. */
  enumChoices?: string[];
  /** Default string value when the cell is absent. */
  defaultValue?: string;
  /** The `checkbox` type: the cell holds `[ ]` or `[x]` and is read as a boolean. */
  checkbox?: boolean;
};
