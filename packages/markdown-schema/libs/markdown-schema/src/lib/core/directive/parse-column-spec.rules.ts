import type { ColumnSpec } from './column-spec.model.ts';
import { splitEscapedChoices } from './split-escaped-choices.rules.ts';
import { DirectiveError } from './directive.error.ts';

/**
 * Parses a semicolon-separated column-spec string into a {@link ColumnSpec}.
 *
 * Column spec grammar (mirrors the inline field grammar):
 * - `string; required`
 * - `string; regex` followed by the pattern in backticks, then `; required`
 * - `enum: A | B | C; required`
 * - `string; key`, a required column whose values identify the rows
 * - `checkbox`, a cell that holds `[ ]` or `[x]` and is read as a boolean; it takes no other
 *   modifier
 * @param spec - Semicolon-separated spec string, e.g. `"string; required"`.
 * @returns A {@link ColumnSpec} describing the column's constraints.
 */
export function parseColumnSpec(spec: string): ColumnSpec {
  const parts = spec.split(';').map((s) => s.trim());
  let required = true;
  let sawRequired = false;
  let sawOptional = false;
  let key = false;
  let regex: string | undefined;
  let enumChoices: string[] | undefined;
  let defaultValue: string | undefined;
  let checkbox = false;

  for (const part of parts) {
    if (part.length === 0) {
      // trailing/empty segment from a stray semicolon — ignore
    } else if (part === 'string') {
      // type token — present but carries no extra info
    } else if (part === 'checkbox') {
      checkbox = true;
    } else if (part === 'optional') {
      required = false;
      sawOptional = true;
    } else if (part === 'key') {
      key = true;
    } else if (part === 'required') {
      required = true;
      sawRequired = true;
    } else if (part.startsWith('regex')) {
      const m = /`([^`]+)`/.exec(part);
      if (!m) {
        throw new DirectiveError(
          `regex modifier must wrap the pattern in backticks (\`...\`), got: '${part}'`,
          { body: spec },
        );
      }
      regex = m[1];
    } else if (part.startsWith('enum:')) {
      enumChoices = splitEscapedChoices(part.slice('enum:'.length).trim());
    } else if (part.startsWith('default=')) {
      defaultValue = part.slice('default='.length).replace(/^["']/, '').replace(/["']$/, '');
    } else {
      throw new DirectiveError(`unknown column modifier: '${part}'`, {
        body: spec,
      });
    }
  }

  if (checkbox) {
    if (
      key ||
      sawOptional ||
      regex !== undefined ||
      enumChoices !== undefined ||
      defaultValue !== undefined
    ) {
      throw new DirectiveError(
        `a 'checkbox' column takes no other modifier than 'required' (a cell is always '[ ]' or '[x]')`,
        { body: spec },
      );
    }
    return { required: true, key: false, checkbox: true };
  }

  if (key) {
    if (sawOptional) {
      throw new DirectiveError(
        `a column cannot be both 'key' and 'optional' (contradictory); a key is always required`,
        { body: spec },
      );
    }
    if (defaultValue !== undefined) {
      throw new DirectiveError(
        `a column cannot be both 'key' and carry a 'default=' (contradictory); a key is always required`,
        { body: spec },
      );
    }
    required = true;
  }

  if (defaultValue !== undefined) {
    if (sawRequired) {
      throw new DirectiveError(
        `a column cannot be both 'required' and carry a 'default=' (contradictory); a default only applies to an optional column`,
        { body: spec },
      );
    }
    // A default supplies a value when the cell is blank, so the column is
    // implicitly optional.
    required = false;
  }

  return { required, key, regex, enumChoices, defaultValue };
}
