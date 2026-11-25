import type { ParsedDirective } from './parsed-directive.model.ts';
import { DirectiveError } from './directive.error.ts';
import { parseIntModifier } from './parse-int-modifier.rules.ts';

/**
 * Parses the body of a `section` block directive.
 *
 * All modifiers live on the opener line, semicolon-separated:
 * `section; optional; remove-if Type=View`
 * `section; min-groups: 1; max-groups: 10`
 * `section; min-items: 1; max-items: 20` and a `regex` modifier (task-list sections)
 * @param body - Trimmed directive body starting with `section`.
 * @returns A `section` ParsedDirective.
 */
export function parseSectionDirective(body: string): ParsedDirective & { kind: 'section' } {
  const allLines = body.split('\n');
  const openerLine = allLines[0] ?? '';
  const bodyLines = allLines.slice(1);

  // Body lines (non-blank, non-//) are a migration error
  for (const line of bodyLines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    if (trimmed.startsWith('//')) continue;
    throw new DirectiveError(
      `section modifiers must be on the directive opener, not in the body; found: "${trimmed}"`,
      { body },
    );
  }

  const parts = openerLine
    .slice('section'.length)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  let optional = false;
  let removeIf: { key: string; value: string } | undefined;
  let minGroups: number | undefined;
  let maxGroups: number | undefined;
  let minItems: number | undefined;
  let maxItems: number | undefined;
  let itemRegex: string | undefined;

  for (const part of parts) {
    if (part === 'optional') {
      optional = true;
    } else if (part.startsWith('remove-if ')) {
      const rest = part.slice('remove-if '.length);
      const eqIdx = rest.indexOf('=');
      if (eqIdx < 0) {
        throw new DirectiveError(`remove-if must be 'remove-if Key=Value', got: '${part}'`, {
          body,
        });
      }
      removeIf = {
        key: rest.slice(0, eqIdx).trim(),
        value: rest.slice(eqIdx + 1).trim(),
      };
    } else if (part.startsWith('min-groups:')) {
      minGroups = parseIntModifier(part.slice('min-groups:'.length), 'min-groups', body);
    } else if (part.startsWith('max-groups:')) {
      maxGroups = parseIntModifier(part.slice('max-groups:'.length), 'max-groups', body);
    } else if (part.startsWith('min-items:')) {
      minItems = parseIntModifier(part.slice('min-items:'.length), 'min-items', body);
    } else if (part.startsWith('max-items:')) {
      maxItems = parseIntModifier(part.slice('max-items:'.length), 'max-items', body);
    } else if (part.startsWith('regex')) {
      const m = /`([^`]+)`/.exec(part);
      if (!m) {
        throw new DirectiveError(
          `regex modifier must wrap the pattern in backticks (\`...\`), got: '${part}'`,
          { body },
        );
      }
      itemRegex = m[1];
    } else {
      throw new DirectiveError(`unknown section modifier: '${part}'`, { body });
    }
  }

  return {
    kind: 'section',
    optional,
    removeIf,
    minGroups,
    maxGroups,
    minItems,
    maxItems,
    itemRegex,
  };
}
