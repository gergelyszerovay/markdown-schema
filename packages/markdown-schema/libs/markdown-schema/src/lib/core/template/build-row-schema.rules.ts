import { z } from 'zod';
import type { ColumnSpec } from '../directive/column-spec.model.ts';
import { compileUserRegex } from '../directive/compile-user-regex.rules.ts';

/**
 * Builds a Zod schema for one table row from the column specs parsed from a
 * `row` directive.
 *
 * A `required` string column gets `.min(1)` so an empty cell is rejected
 * (matching the inline field path). Columns carrying a `default=` value are
 * optional; an empty or absent cell is substituted with the default via a
 * `z.preprocess` before validation, so the emitted JSON carries the default.
 *
 * A `checkbox` column accepts only `[ ]`, `[x]` or `[X]` and yields a boolean.
 * @param columns - Map of column header → column spec.
 * @returns A `z.object({...}).strict()` schema keyed by column header text,
 *   wrapped in a defaulting preprocess when any column declares `default=`.
 */
export function buildRowSchema(columns: Record<string, ColumnSpec>): z.ZodType {
  const shape: Record<string, z.ZodType> = {};

  for (const [col, spec] of Object.entries(columns)) {
    // Compile the user-supplied regex once, through the ReDoS-safe choke point.
    const re = spec.regex ? compileUserRegex(spec.regex, col) : undefined;
    let field: z.ZodType;

    if (spec.checkbox) {
      field = z
        .string()
        .refine((cell) => /^\[[ xX]\]$/.test(cell), {
          message: `a checkbox cell must be '[ ]' or '[x]'`,
        })
        .transform((cell) => cell !== '[ ]');
    } else if (spec.enumChoices && spec.enumChoices.length > 0) {
      field = z.enum(spec.enumChoices as [string, ...string[]]);
    } else if (re) {
      field = spec.required ? z.string().min(1).regex(re) : z.string().regex(re);
    } else {
      field = spec.required ? z.string().min(1) : z.string();
    }

    if (!spec.required) field = field.optional();

    shape[col] = field;
  }

  const objectValidator = z.object(shape).strict();

  const defaulted = Object.entries(columns).filter(([, spec]) => spec.defaultValue !== undefined);
  if (defaulted.length === 0) return objectValidator;

  // Substitute defaults for empty/absent cells before validation so the
  // emitted row object carries the defaulted value.
  return z.preprocess((val) => {
    if (!val || typeof val !== 'object') return val;
    const src = val as Record<string, unknown>;
    // Null-prototype: cell keys come from the document's table headers.
    const row = Object.create(null) as Record<string, unknown>;
    for (const k of Object.keys(src)) row[k] = src[k];
    for (const [col, spec] of defaulted) {
      if (row[col] === undefined || row[col] === '') {
        row[col] = spec.defaultValue;
      }
    }
    return row;
  }, objectValidator);
}
