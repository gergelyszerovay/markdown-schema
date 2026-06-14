import { z } from "zod";
import type { ZodTypeAny } from "zod";
import type { ColumnSpec } from "../_shared/parsed-directive";
import { compileUserRegex } from "../_shared/compile-user-regex";

/**
 * Builds a Zod schema for one table row from the column specs parsed from a
 * `row` directive.
 *
 * @param columns - Map of column header → column spec.
 * @returns A `z.object({...}).strict()` schema keyed by column header text.
 */
export function buildRowSchema(
  columns: Record<string, ColumnSpec>,
): ZodTypeAny {
  const shape: Record<string, ZodTypeAny> = {};

  for (const [col, spec] of Object.entries(columns)) {
    // Compile the user-supplied regex once, through the ReDoS-safe choke point.
    const re = spec.regex ? compileUserRegex(spec.regex, col) : undefined;
    let field: ZodTypeAny;

    if (spec.enumChoices && spec.enumChoices.length > 0) {
      field = z.enum(spec.enumChoices as [string, ...string[]]);
    } else if (re) {
      field = z.string().regex(re);
    } else {
      field = z.string();
    }

    if (spec.required) {
      if (spec.enumChoices && spec.enumChoices.length > 0) {
        field = z.enum(spec.enumChoices as [string, ...string[]]);
      } else if (re) {
        field = z.string().min(1).regex(re);
      } else {
        field = z.string();
      }
    } else {
      field = field.optional();
    }

    shape[col] = field;
  }

  return z.object(shape).strict();
}
