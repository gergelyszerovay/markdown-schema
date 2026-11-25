import type { Root, Heading } from 'mdast';
import { extractDirectiveBody } from '../directive/extract-directive-body.rules.ts';
import { parseDirective } from '../directive/parse-directive.rules.ts';
import { DirectiveError } from '../directive/directive.error.ts';
import { compileUserRegex } from '../directive/compile-user-regex.rules.ts';
import type { TitleShape } from './template-shape.model.ts';

/**
 * Infers the title's shape from the template's H1 node.
 *
 * If the heading contains an inline html comment (a placeholder), the directive body
 * chooses the composed pattern:
 *   - `field` directive with `regex` modifier → match `<prefix> <pattern>`.
 *   - `field` directive without regex → match `<prefix> <any non-empty string>`.
 *   - `enum` directive → match `<prefix> <one of choices>`.
 *   - otherwise → match `<prefix> PascalCaseName`.
 * If the heading has no placeholder, the literal title text is the pattern. A bare
 * placeholder without prefix text yields a shape without a pattern: any non-empty title.
 * @param tree - The mdast Root node to search for the title heading.
 * @param depth - The heading depth that represents the document title.
 * @returns The title's shape, or `undefined` if no matching heading was found (the parse
 *   output then carries no title).
 */
export function inferTitleShape(tree: Root, depth: number): TitleShape | undefined {
  const h = tree.children.find((n): n is Heading => n.type === 'heading' && n.depth === depth);
  if (!h) return undefined;

  // Gather text nodes before the first html comment node
  let prefix = '';
  let hasPlaceholder = false;
  let directiveHtml: string | undefined;
  for (const child of h.children) {
    if (child.type === 'text') prefix += child.value;
    else if (child.type === 'html') {
      hasPlaceholder = true;
      directiveHtml = child.value;
      break;
    }
  }
  // Preserve trailing whitespace so prefixes ending in `-` (e.g. `CR-`) don't
  // force a space between prefix and suffix in the resulting regex; the
  // template author controls spacing via the literal text.
  prefix = prefix.replace(/^\s+/, '');
  const hadTrailingSpace = /\s$/.test(prefix);
  prefix = prefix.replace(/\s+$/, '');

  if (prefix && hasPlaceholder) {
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sep = hadTrailingSpace ? ' ' : '';

    const body = directiveHtml ? extractDirectiveBody(directiveHtml) : null;
    // A TEMPLATE-ONLY directive in the H1 must be a `field` or `enum`; any other
    // kind (or an unparseable body) is a hard error naming the position, rather
    // than a silent degrade to the PascalCase default. A non-directive HTML
    // comment (extractDirectiveBody → null) still falls through to the default.
    const directive = body ? parseDirective(body) : null;
    if (directive !== null && directive.kind !== 'field' && directive.kind !== 'enum') {
      throw new DirectiveError(
        `H1 title only supports inline field or enum directives, got: ${directive.kind}`,
      );
    }

    if (directive?.kind === 'field') {
      // Validate the author-supplied regex through the ReDoS-safe choke point
      // before interpolating it into the composed title pattern. compileUserRegex
      // rejects unsafe/over-long sources; the returned `.source` is the
      // validated pattern (no surrounding delimiters).
      const innerSource = directive.regex
        ? compileUserRegex(directive.regex, 'title').source.replace(/^\^|\$$/g, '')
        : undefined;
      const suffix = innerSource ? `(?:${innerSource})` : `.+`;
      const label = directive.regex ?? 'value';
      return {
        pattern: `^${escaped}${sep}${suffix}$`,
        message: `title must match '${prefix}${sep}<${label}>'`,
        kind: 'field',
        prefix,
        separator: sep,
        regex: directive.regex,
      };
    }

    if (directive !== null) {
      const choicePattern = directive.choices
        .map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|');
      return {
        pattern: `^${escaped}${sep}(?:${choicePattern})$`,
        message: `title must be '${prefix}${sep}<${directive.choices.join(' | ')}>'`,
        kind: 'enum',
        prefix,
        separator: sep,
        choices: directive.choices,
      };
    }

    // Default: PascalCase suffix.
    return {
      pattern: `^${escaped}${sep}[A-Z][A-Za-z0-9]*$`,
      message: `title must be '${prefix}${sep}PascalCaseName'`,
      kind: 'pascal-case',
      prefix,
      separator: sep,
    };
  }

  if (prefix) {
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return {
      pattern: `^${escaped}$`,
      message: `title must be '${prefix}'`,
      kind: 'literal',
      prefix,
    };
  }

  return {};
}
