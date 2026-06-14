import { z } from "zod";
import type { ZodTypeAny } from "zod";
import type { ParsedDirective } from "../_shared/parsed-directive";
import { compileUserRegex } from "../_shared/compile-user-regex";

/**
 * Converts a `field` or `enum` {@link ParsedDirective} into a Zod schema
 * suitable for validating a single string value (e.g. a heading or title).
 *
 * @param directive - A `field` or `enum` ParsedDirective.
 * @returns A Zod string (or enum) schema.
 */
export function directiveToFieldSchema(directive: ParsedDirective): ZodTypeAny {
  if (directive.kind === "enum") {
    const base = z.enum(directive.choices as [string, ...string[]]);
    return directive.required ? base : base.optional();
  }
  if (directive.kind === "field") {
    const base = directive.regex
      ? z.string().min(1).regex(compileUserRegex(directive.regex))
      : z.string().min(1);
    return directive.required ? base : base.optional();
  }
  return z.string().min(1);
}
