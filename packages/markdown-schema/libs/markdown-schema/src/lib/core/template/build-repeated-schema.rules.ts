import { z } from 'zod';

/**
 * Builds the schema for a `repeated` section: an array of heading+items
 * group objects, bounded by the group-count modifiers and with each group's
 * heading validated by the heading schema when there is one.
 * @param minGroups - Minimum number of groups required, or undefined.
 * @param maxGroups - Maximum number of groups allowed, or undefined.
 * @param headingSchema - Optional Zod schema to validate the per-group heading text.
 * @returns A Zod schema validating an array of heading+items group objects.
 */
export function buildRepeatedSchema(
  minGroups: number | undefined,
  maxGroups: number | undefined,
  headingSchema?: z.ZodType,
): z.ZodType {
  const groupItemZod = z.object({
    heading: headingSchema ?? z.string().min(1),
    items: z.array(z.string()),
  });

  let schema: z.ZodType = z.array(groupItemZod);
  if (minGroups) schema = (schema as ReturnType<typeof z.array>).min(minGroups);
  if (maxGroups) schema = (schema as ReturnType<typeof z.array>).max(maxGroups);
  return schema;
}
