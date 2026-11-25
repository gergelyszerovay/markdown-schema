import { z } from 'zod';
import type { ParsedDirective } from '../directive/parsed-directive.model.ts';
import { compileUserRegex } from '../directive/compile-user-regex.rules.ts';
import { DirectiveError } from '../directive/directive.error.ts';

/**
 * Builds a `z.array(z.string()).transform(…).superRefine(…)` schema that
 * validates a labeled bullet list extracted by `bulletList`.
 *
 * Output type: `Record<string, string | undefined>`.
 *
 * Behaviour:
 * - Only `enum` / `field` item directives are supported; any other kind
 *   (`guide`, `row`, `section`, `freetext`) on a labeled-list item is a hard
 *   {@link DirectiveError} rather than a silently-dropped key.
 * - `default=` on a field fills a missing/blank declared key with the default
 *   value before validation, so the emitted JSON carries it.
 * - Keys present in the document but not declared in the template are rejected
 *   (fail-closed: additions are not silently accepted).
 * @param itemDirectives - Record mapping label keys to their parsed directives.
 * @returns A Zod schema that validates and transforms bullet list lines into a keyed record.
 */
export function buildLabeledListSchema(
  itemDirectives: Record<string, ParsedDirective | null>,
): z.ZodType {
  type FieldSpec = {
    required: boolean;
    validate: (val: string | undefined) => string | null; // null = ok, string = error
    onlyIf?: { key: string; value: string };
    defaultValue?: string;
  };

  const specs: Record<string, FieldSpec> = {};
  for (const [key, d] of Object.entries(itemDirectives)) {
    if (!d) {
      specs[key] = { required: false, validate: (): null => null };
      continue;
    }
    if (d.kind === 'enum') {
      specs[key] = {
        required: d.required,
        validate: (val): string | null => {
          if (d.required && !val) return `${key} is required`;
          if (val && !d.choices.includes(val))
            return `Invalid option: expected one of ${d.choices.map((c) => `"${c}"`).join('|')}`;
          return null;
        },
      };
    } else if (d.kind === 'field') {
      const spec = d;
      // Compile once at schema-build time through the ReDoS-safe choke point,
      // not on every value in the per-line validator.
      const re = spec.regex ? compileUserRegex(spec.regex, key) : undefined;
      specs[key] = {
        required: spec.required,
        validate: (val): string | null => {
          if (spec.required && !val) return `${key} is required`;
          if (val && re) {
            if (!re.test(val)) return `${key} does not match required format`;
          }
          return null;
        },
        onlyIf: spec.onlyIf,
        defaultValue: spec.defaultValue,
      };
    } else {
      throw new DirectiveError(
        `labeled-list item "${key}" only supports inline field or enum directives, got: ${d.kind}`,
      );
    }
  }

  return z
    .array(z.string())
    .transform((lines) => {
      // Null-prototype: line labels are untrusted (a `__proto__:` line must not
      // hit the prototype setter).
      const obj = Object.create(null) as Record<string, string | undefined>;
      for (const line of lines) {
        const idx = line.indexOf(':');
        if (idx < 0) continue;
        const k = line.slice(0, idx).trim();
        if (!k) continue;
        // Guard against a bare-link bullet (`- [x](https://…)`) whose extracted
        // URL splits at the scheme colon into a junk key (`https`) with a
        // `//…` value. A real label never contains a path separator, and a
        // multi-word prose line that isn't a declared key is not a labeled item.
        const rest = line.slice(idx + 1);
        if (k.includes('/')) continue;
        if (rest.trimStart().startsWith('//')) continue;
        if (/\s/.test(k) && !Object.hasOwn(specs, k)) continue;
        obj[k] = rest.trim() || undefined;
      }
      // Apply declared defaults for blank/absent keys so the emitted JSON
      // carries the default value.
      for (const [key, spec] of Object.entries(specs)) {
        if (spec.defaultValue !== undefined && !obj[key]) {
          obj[key] = spec.defaultValue;
        }
      }
      return obj;
    })
    .superRefine((obj, ctx) => {
      for (const [key, spec] of Object.entries(specs)) {
        const val = obj[key];
        const err = spec.validate(val);
        if (err) {
          ctx.addIssue({ code: 'custom', path: [key], message: err });
        }
        if (spec.onlyIf && val) {
          const guardVal = obj[spec.onlyIf.key];
          if (guardVal !== spec.onlyIf.value) {
            ctx.addIssue({
              code: 'custom',
              path: [key],
              message: `${key} is only allowed when ${spec.onlyIf.key}=${spec.onlyIf.value}`,
            });
          }
        }
      }
      // Reject undeclared keys: additions are not silently accepted.
      for (const key of Object.keys(obj)) {
        if (!Object.hasOwn(specs, key)) {
          ctx.addIssue({
            code: 'custom',
            path: [key],
            message: `Unrecognized key "${key}": not declared in the template`,
          });
        }
      }
    });
}
