/**
 * A column specification within a `row` directive.
 *
 * @property required - Whether the column must be non-empty.
 * @property regex - Regular-expression string when the value must match a pattern.
 * @property enumChoices - Allowed values when the column has a fixed choice list.
 * @property defaultValue - Default string value when the cell is absent.
 */
export type ColumnSpec = {
  required: boolean;
  regex?: string;
  enumChoices?: string[];
  defaultValue?: string;
};
