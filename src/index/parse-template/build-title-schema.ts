import { z } from "zod";
import type { Root, Heading } from "mdast";
import { extractDirectiveBody } from "./_shared/extract-directive-body";
import { parseDirective } from "./_shared/parse-directive";
import { DirectiveError } from "./_shared/directive-error";
import { compileUserRegex } from "./_shared/compile-user-regex";

/**
 * Builds a title validation schema from the H1 node.
 *
 * If the heading contains an inline html comment (a placeholder), the schema
 * uses the directive body to choose its shape:
 *   - `field` directive with `regex` modifier → match `<prefix> <pattern>`.
 *   - `field` directive without regex → match `<prefix> <any non-empty string>`.
 *   - `enum` directive → match `<prefix> <one of choices>`.
 *   - otherwise → match `<prefix> PascalCaseName`.
 * If the heading has no placeholder, it validates the literal title text.
 *
 * @param tree - The mdast Root node to search for the title heading.
 * @param depth - The heading depth that represents the document title.
 * @returns A Zod string schema for the title, or `undefined` if no matching heading found.
 */
export function buildTitleSchema(
  tree: Root,
  depth: number,
): z.ZodString | undefined {
  const h = tree.children.find(
    (n): n is Heading => n.type === "heading" && n.depth === depth,
  );
  if (!h) return undefined;

  // Gather text nodes before the first html comment node
  let prefix = "";
  let hasPlaceholder = false;
  let directiveHtml: string | undefined;
  for (const child of h.children) {
    if (child.type === "text") prefix += child.value;
    else if (child.type === "html") {
      hasPlaceholder = true;
      directiveHtml = child.value;
      break;
    }
  }
  // Preserve trailing whitespace so prefixes ending in `-` (e.g. `CR-`) don't
  // force a space between prefix and suffix in the resulting regex; the
  // template author controls spacing via the literal text.
  prefix = prefix.replace(/^\s+/, "");
  const hadTrailingSpace = /\s$/.test(prefix);
  prefix = prefix.replace(/\s+$/, "");

  if (prefix && hasPlaceholder) {
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const sep = hadTrailingSpace ? " " : "";

    const body = directiveHtml ? extractDirectiveBody(directiveHtml) : null;
    let directive = null;
    if (body) {
      try {
        directive = parseDirective(body);
      } catch (err) {
        if (!(err instanceof DirectiveError)) throw err;
        // Unrecognised body (e.g. free-text H1 hint) falls through to PascalCase default
      }
    }

    if (directive && directive.kind === "field") {
      // Validate the author-supplied regex through the ReDoS-safe choke point
      // before interpolating it into the composed title pattern. compileUserRegex
      // rejects unsafe/over-long sources; the returned `.source` is the
      // validated pattern (no surrounding delimiters).
      const innerSource = directive.regex
        ? compileUserRegex(directive.regex, "title").source.replace(
            /^\^|\$$/g,
            "",
          )
        : undefined;
      const suffix = innerSource ? `(?:${innerSource})` : `.+`;
      const label = directive.regex ? directive.regex : "value";
      return z
        .string()
        .regex(
          new RegExp(`^${escaped}${sep}${suffix}$`),
          `title must match '${prefix}${sep}<${label}>'`,
        );
    }

    if (directive && directive.kind === "enum") {
      const choicePattern = directive.choices
        .map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|");
      return z
        .string()
        .regex(
          new RegExp(`^${escaped}${sep}(?:${choicePattern})$`),
          `title must be '${prefix}${sep}<${directive.choices.join(" | ")}>'`,
        );
    }

    // Default: PascalCase suffix.
    return z
      .string()
      .regex(
        new RegExp(`^${escaped}${sep}[A-Z][A-Za-z0-9]*$`),
        `title must be '${prefix}${sep}PascalCaseName'`,
      );
  }

  if (prefix) {
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return z
      .string()
      .regex(new RegExp(`^${escaped}$`), `title must be '${prefix}'`);
  }

  return z.string().min(1);
}
