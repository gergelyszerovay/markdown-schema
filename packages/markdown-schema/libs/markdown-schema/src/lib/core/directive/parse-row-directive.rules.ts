import type { ColumnSpec } from './column-spec.model.ts';
import type { ParsedDirective } from './parsed-directive.model.ts';
import { parseColumnSpec } from './parse-column-spec.rules.ts';
import { DirectiveError } from './directive.error.ts';
import { parseIntModifier } from './parse-int-modifier.rules.ts';

/**
 * Parses the body of a `row` block directive.
 *
 * The opener line may carry semicolon-separated modifiers:
 * `row; min-rows: 1; max-rows: 50`
 *
 * Body lines are column specs (at column 0):
 * `ColumnName: string; required`
 * `OtherCol: enum: Yes | No; required`
 * @param body - Trimmed directive body starting with `row`.
 * @returns A `row` ParsedDirective.
 */
export function parseRowDirective(body: string): ParsedDirective & { kind: 'row' } {
  const allLines = body.split('\n');
  const openerLine = allLines[0] ?? '';
  const bodyLines = allLines.slice(1);

  // Parse modifiers from the opener (everything after "row")
  const openerParts = openerLine
    .slice('row'.length)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  const columns: Record<string, ColumnSpec> = {};
  let minRows: number | undefined;
  let maxRows: number | undefined;
  let sectionOptional = false;

  for (const part of openerParts) {
    if (part.startsWith('min-rows:')) {
      minRows = parseIntModifier(part.slice('min-rows:'.length), 'min-rows', body);
    } else if (part.startsWith('max-rows:')) {
      maxRows = parseIntModifier(part.slice('max-rows:'.length), 'max-rows', body);
    } else if (part === 'section-optional') {
      sectionOptional = true;
    } else {
      throw new DirectiveError(`unknown row modifier: '${part}'`, { body });
    }
  }

  // Parse body lines as column specs
  for (const line of bodyLines) {
    if (line.trim().length === 0) continue;
    if (line.trim().startsWith('//')) continue;

    // Modifiers on body lines are a migration error
    if (
      line.trim().startsWith('min-rows:') ||
      line.trim().startsWith('max-rows:') ||
      line.trim() === 'section-optional'
    ) {
      throw new DirectiveError(
        `min-rows / max-rows / section-optional must be on the directive opener, not in the body`,
        { body },
      );
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx > -1) {
      let colName = line.slice(0, colonIdx).trim();
      // Strip surrounding quotes so column names that need to escape special
      // characters (e.g. `"#"`, `"some name"`) work transparently.
      if (
        (colName.startsWith('"') && colName.endsWith('"')) ||
        (colName.startsWith("'") && colName.endsWith("'"))
      ) {
        colName = colName.slice(1, -1);
      }
      const spec = line.slice(colonIdx + 1).trim();
      if (colName) columns[colName] = parseColumnSpec(spec);
    }
  }

  return { kind: 'row', columns, minRows, maxRows, sectionOptional };
}
