import { z } from "zod";
import type { ZodTypeAny } from "zod";
import type { ParsedDirective } from "../_shared/parsed-directive";
import { compileUserRegex } from "../_shared/compile-user-regex";

/**
 * Builds a `z.array(z.string()).transform(…).superRefine(…)` schema that
 * validates a labeled bullet list extracted by `bulletList`.
 *
 * Output type: `Record<string, string | undefined>`.
 *
 * @param itemDirectives - Record mapping label keys to their parsed directives.
 * @returns A Zod schema that validates and transforms bullet list lines into a keyed record.
 */
export function buildLabeledListSchema(
  itemDirectives: Record<string, ParsedDirective | null>,
): ZodTypeAny {
  type FieldSpec = {
    required: boolean;
    validate: (val: string | undefined) => string | null; // null = ok, string = error
    onlyIf?: { key: string; value: string };
  };

  const specs: Record<string, FieldSpec> = {};
  for (const [key, d] of Object.entries(itemDirectives)) {
    if (!d) {
      specs[key] = { required: false, validate: () => null };
      continue;
    }
    if (d.kind === "enum") {
      specs[key] = {
        required: d.required,
        validate: (val) => {
          if (d.required && !val) return `${key} is required`;
          if (val && !d.choices.includes(val))
            return `Invalid option: expected one of ${d.choices.map((c) => `"${c}"`).join("|")}`;
          return null;
        },
      };
    } else if (d.kind === "field") {
      const spec = d;
      // Compile once at schema-build time through the ReDoS-safe choke point,
      // not on every value in the per-line validator.
      const re = spec.regex ? compileUserRegex(spec.regex, key) : undefined;
      specs[key] = {
        required: spec.required,
        validate: (val) => {
          if (spec.required && !val) return `${key} is required`;
          if (val && re) {
            if (!re.test(val)) return `${key} does not match required format`;
          }
          return null;
        },
        onlyIf: spec.onlyIf,
      };
    }
  }

  return z
    .array(z.string())
    .transform((lines) => {
      // Null-prototype: line labels are untrusted (a `__proto__:` line must not
      // hit the prototype setter).
      const obj = Object.create(null) as Record<string, string | undefined>;
      for (const line of lines) {
        const idx = line.indexOf(":");
        if (idx >= 0) {
          const k = line.slice(0, idx).trim();
          const v = line.slice(idx + 1).trim();
          if (k) obj[k] = v || undefined;
        }
      }
      return obj;
    })
    .superRefine((obj, ctx) => {
      for (const [key, spec] of Object.entries(specs)) {
        const val = obj[key];
        const err = spec.validate(val);
        if (err) {
          ctx.addIssue({ code: "custom", path: [key], message: err });
        }
        if (spec.onlyIf && val) {
          const guardVal = obj[spec.onlyIf.key];
          if (guardVal !== spec.onlyIf.value) {
            ctx.addIssue({
              code: "custom",
              path: [key],
              message: `${key} is only allowed when ${spec.onlyIf.key}=${spec.onlyIf.value}`,
            });
          }
        }
      }
    });
}
