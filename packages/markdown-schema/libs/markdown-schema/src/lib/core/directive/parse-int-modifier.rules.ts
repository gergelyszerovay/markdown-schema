import { DirectiveError } from './directive.error.ts';

/**
 * Parses and validates a non-negative integer modifier value (e.g. the `N` in
 * `min-rows: N`, `max-rows: N`, `min-groups: N`, `max-groups: N`).
 *
 * A non-integer or negative value is a hard {@link DirectiveError} rather than a
 * silent no-op: `parseInt("lots") → NaN` would otherwise disable the constraint
 * without warning, which contradicts the package's fail-closed stance.
 * @param raw - The raw value string (already trimmed of the modifier prefix).
 * @param name - The modifier name, used in the error message (e.g. `"min-rows"`).
 * @param body - The directive body, attached to the error for context.
 * @returns The parsed non-negative integer. Throws a {@link DirectiveError} when
 *   `raw` is not a non-negative integer.
 */
export function parseIntModifier(raw: string, name: string, body: string): number {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new DirectiveError(`${name} must be a non-negative integer, got: '${trimmed}'`, { body });
  }
  return Number.parseInt(trimmed, 10);
}
