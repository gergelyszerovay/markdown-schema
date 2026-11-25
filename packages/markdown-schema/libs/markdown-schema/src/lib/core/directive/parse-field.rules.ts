import type { ParsedDirective } from './parsed-directive.model.ts';
import { DirectiveError } from './directive.error.ts';

/**
 * Parses the body of a field directive.
 *
 * Expected form (semicolon-separated modifiers):
 * - `string; required`
 * - `string; optional; only-if Type=Primitive`
 * - `string; regex` followed by the pattern in backticks, then `; required`
 *
 * The `regex` modifier must follow `string`: a bare `regex` modifier without
 * a leading `string` token is rejected by the dispatcher before this function
 * is called.
 *
 * Fails closed: any modifier that is not one of `optional`, `required`,
 * `regex`, `default=`, `only-if` is a hard {@link DirectiveError}. A field
 * carrying `default=` is implicitly optional (the default fills a blank value);
 * combining an explicit `required` with `default=`, or `required` with
 * `only-if`, is contradictory and rejected at template-parse time.
 * @param body - Trimmed directive body starting with `string`.
 * @returns A `field` ParsedDirective.
 */
export function parseField(body: string): ParsedDirective & { kind: 'field' } {
  const parts = body.split(';').map((s) => s.trim());
  let required = true;
  let sawRequired = false;
  let regex: string | undefined;
  let defaultValue: string | undefined;
  let onlyIf: { key: string; value: string } | undefined;

  for (const part of parts) {
    if (part.length === 0) {
      // trailing/empty segment from a stray semicolon — ignore
    } else if (part === 'string') {
      // type token — present but carries no extra info
    } else if (part === 'optional') {
      required = false;
    } else if (part === 'required') {
      required = true;
      sawRequired = true;
    } else if (part.startsWith('regex')) {
      const m = /`([^`]+)`/.exec(part);
      if (!m) {
        throw new DirectiveError(
          `regex modifier must wrap the pattern in backticks (\`...\`), got: '${part}'`,
          { body },
        );
      }
      regex = m[1];
    } else if (part.startsWith('default=')) {
      defaultValue = part.slice('default='.length).replace(/^["']/, '').replace(/["']$/, '');
    } else if (part.startsWith('only-if ')) {
      const rest = part.slice('only-if '.length);
      const eqIdx = rest.indexOf('=');
      if (eqIdx < 0) {
        throw new DirectiveError(`only-if must be 'only-if Key=Value', got: '${part}'`, { body });
      }
      onlyIf = {
        key: rest.slice(0, eqIdx).trim(),
        value: rest.slice(eqIdx + 1).trim(),
      };
    } else {
      throw new DirectiveError(`unknown field modifier: '${part}'`, { body });
    }
  }

  if (defaultValue !== undefined) {
    if (sawRequired) {
      throw new DirectiveError(
        `a field cannot be both 'required' and carry a 'default=' (contradictory); a default only applies to an optional field`,
        { body },
      );
    }
    // A default supplies a value when the field is blank, so the field is
    // implicitly optional.
    required = false;
  }

  if (required && onlyIf) {
    throw new DirectiveError(
      `a field cannot be both 'required' and 'only-if ${onlyIf.key}=${onlyIf.value}' (contradictory); use 'optional; only-if ...'`,
      { body },
    );
  }

  return { kind: 'field', required, regex, defaultValue, onlyIf };
}
