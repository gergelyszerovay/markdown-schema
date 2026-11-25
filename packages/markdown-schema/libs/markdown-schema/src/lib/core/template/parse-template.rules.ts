import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import type { Root } from 'mdast';
import type { DocumentData } from '../doc-schema/document-data.model.ts';
import type { RefineFunction } from '../refine-function.model.ts';
import { validateDirectiveShape } from '../directive/validate-directive-shape.rules.ts';
import type { KeyColumn } from './key-column.model.ts';
import { collectUnverifiedRegexes, verifyRegexes } from '../directive/compile-user-regex.rules.ts';
import { compileTemplateShape } from './compile-template-shape.rules.ts';
import { inferTemplateShape } from './infer-template-shape.rules.ts';
import type { TemplateShape } from './template-shape.model.ts';

/** A compiled template: its shape, a document parser and the key columns of its tables. */
export type ParsedTemplate = {
  /**
   * Parses and validates a document.
   * @param raw - The document's text.
   * @param options - `tree`: the document's mdast tree, parsed with remark, GFM and YAML frontmatter, so the text is not parsed again.
   */
  parse(raw: string, options?: { tree?: Root }): DocumentData;
  keyColumns: KeyColumn[];
  /** Everything the template declares, as plain data; the schema is compiled from it. */
  shape: TemplateShape;
};

/**
 * Parses a `*.template.md` document into a `defineDocSchema` schema object
 * that can validate filled instances of the template.
 *
 * The template compiles in two steps: `inferTemplateShape` reads the
 * `<!-- TEMPLATE-ONLY: -->` directives into the published {@link TemplateShape}, and
 * `compileTemplateShape` turns the shape into the zod schema and extractors, so the shape
 * is the single source of truth for what the template requires. The directives:
 * - `enum:` → `z.enum([...])`
 * - field directives (`string; …`) → typed scalar with optional/required/regex modifiers
 * - `row` directive → table row schema
 * - `section` directive → optional/remove-if/min-groups for the section
 * - `guide` directive → author prose, ignored by the schema
 * - `document` directive (between the title and the first section) → `open` accepts a
 *   section the template does not declare, parsed as free text into the document's
 *   `additionalSections` (each `{ key, heading, text }`); `unordered` lets the declared
 *   sections appear in any order
 * - a field directive in a `>` blockquote between the title and the first section → the
 *   document's summary: required or optional as written, checked against its regex, and
 *   extracted as `summary`
 *
 * An optional `refine` function (loaded separately via {@link loadRefine})
 * can be supplied via `opts.refine` to add cross-section invariants.
 *
 * Inline directives must close on the same line as the opener. Multi-line
 * bodies are reserved for block directives. Unknown directive keywords are
 * hard errors with position information.
 * @param templateRaw - Raw markdown content of the template file.
 * @param opts - Optional configuration. `refine`: cross-section refinement callback to attach. `file`: source file path used in error messages. `orderedSections`: when `false`, disables the check that document sections appear in the same order as the template. Defaults to `true`; a template declared `unordered` disables the check whatever this says.
 *
 * Columns declared `key` make their rows citable: the values of every key column are unique
 * across the whole document, so a duplicate is a validation error, and `keyColumns` lists
 * them for a caller that wants the row keys of a parsed document (see {@link listRowKeys}).
 * @returns A schema object with a `parse(raw: string)` method, the template's `keyColumns`
 *   and its `shape`.
 */
export function parseTemplate(
  templateRaw: string,
  opts?: { refine?: RefineFunction; file?: string; orderedSections?: boolean },
): ParsedTemplate {
  validateDirectiveShape(templateRaw, opts?.file);
  const tree = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkGfm)
    .parse(templateRaw);

  const shape = inferTemplateShape(tree, { file: opts?.file });
  const { parse, keyColumns } = compileTemplateShape(shape, opts);
  return { parse, keyColumns, shape };
}

/**
 * Compiles a template like {@link parseTemplate}, but analyses the template's regex patterns
 * together and without blocking the event loop first. Verdicts are memoized per pattern, so a
 * template whose patterns are all known compiles without analysis, as with the synchronous entry.
 * @param templateRaw - Raw markdown content of the template file.
 * @param opts - The options of {@link parseTemplate}.
 * @returns The compiled template; it rejects with the error {@link parseTemplate} would throw.
 * @concurrency parallel — the regex analyses of one template run at once; compilations may overlap.
 */
export async function parseTemplateAsync(
  templateRaw: string,
  opts?: Parameters<typeof parseTemplate>[1],
): Promise<ParsedTemplate> {
  await verifyRegexes(collectUnverifiedRegexes(() => void parseTemplate(templateRaw, opts)));
  return parseTemplate(templateRaw, opts);
}
