import { z } from "zod";
import type { ZodTypeAny } from "zod";
import type { RootContent } from "mdast";

/**
 * Builds the per-group schema for a `repeated` section.
 *
 * Inspects the body of the first heading group to determine whether it
 * contains a labeled list (→ labeled schema per group) or a plain list
 * (→ `z.array(z.string())`), then wraps in `z.array(...).min(N)`.
 *
 * @param nodes - The body nodes for the repeated section.
 * @param minGroups - Minimum number of groups required, or undefined.
 * @param maxGroups - Maximum number of groups allowed, or undefined.
 * @param headingSchema - Optional Zod schema to validate the per-group heading text.
 * @returns A Zod schema validating an array of heading+items group objects.
 */
export function buildRepeatedSchema(
  nodes: RootContent[],
  minGroups: number | undefined,
  maxGroups: number | undefined,
  headingSchema?: ZodTypeAny,
): ZodTypeAny {
  const groupItemZod = z.object({
    heading: headingSchema ?? z.string().min(1),
    items: z.array(z.string()),
  });

  let schema: ZodTypeAny = z.array(groupItemZod);
  if (minGroups) schema = (schema as ReturnType<typeof z.array>).min(minGroups);
  if (maxGroups) schema = (schema as ReturnType<typeof z.array>).max(maxGroups);
  return schema;
}
