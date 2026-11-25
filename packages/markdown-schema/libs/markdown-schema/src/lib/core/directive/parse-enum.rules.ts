import type { ParsedDirective } from './parsed-directive.model.ts';
import { splitEscapedChoices } from './split-escaped-choices.rules.ts';
import { DirectiveError } from './directive.error.ts';

/**
 * Parses the body of an `enum:` inline directive.
 *
 * Expected form: `enum: Choice1 | Choice2 | Choice3; required`
 * Choice separators (`|`) may be escaped with `\|` for a literal pipe,
 * or `\\` for a literal backslash.
 *
 * Modifiers after the choices (`;`-separated): `required` / `optional`.
 * Defaults to `required` when neither modifier is present.
 * @param body - Trimmed directive body starting with `enum:`.
 * @returns An `enum` ParsedDirective with the split choices and required flag.
 */
export function parseEnum(body: string): ParsedDirective & { kind: 'enum' } {
  const parts = body.split(';').map((s) => s.trim());
  const choicesPart = parts[0] ?? body;
  const after = choicesPart.slice('enum:'.length).trim();
  const choices = splitEscapedChoices(after);

  let required = true;
  for (const mod of parts.slice(1)) {
    if (mod.length === 0) {
      // trailing/empty segment from a stray semicolon — ignore
    } else if (mod === 'optional') {
      required = false;
    } else if (mod === 'required') {
      required = true;
    } else {
      throw new DirectiveError(`unknown enum modifier: '${mod}'`, { body });
    }
  }

  return { kind: 'enum', choices, required };
}
