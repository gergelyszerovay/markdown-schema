import type { DocumentData } from '../doc-schema/document-data.model.ts';
import type { TemplateShape } from '../template/template-shape.model.ts';
import { buildDocumentTree } from './build-document-tree.rules.ts';
import { writeDataText } from './write-data-text.rules.ts';
import { serializeTree } from './serialize-tree.rules.ts';
import { validateDocumentData } from './validate-document-data.rules.ts';

/**
 * Renders a document from a template's shape and data: the frontmatter, the H1 title, the
 * `>` summary, each declared section in template order, then the `additionalSections` of an
 * open template. A section absent from the data is left out.
 *
 * **The round-trip law:** for any `data` that validates against the template (in the form
 * `parse` returns), `parse(generateDocument(shape, data))` deep-equals `data`, and the text
 * passes validation. The law runs one way: generating from a parsed document need not give
 * the document back byte for byte, because the extractors normalise (a link cell is read as
 * its URL, freetext is re-serialised, `[X]` reads as `[x]`).
 *
 * Tables are written unaligned and values as escaped plain text, so a value that looks like
 * markdown stays literal text; a link in a generated value is not supported. A `www.` or
 * e-mail address inside a value is written as inline code, because GFM would otherwise read
 * it back as a link. A value that cannot sit on one line (a title, a summary, a heading, a
 * table cell) throws; a list item may carry soft line breaks.
 *
 * **Valid by construction:** the data is validated against the shape first (the structural
 * contract of the JSON Schema, plus `only-if`, `remove-if` and unique `key` values), and
 * invalid data throws, naming each section and field, before anything is written, so a
 * wrong-typed value (`'yes'` for a checkbox) is refused rather than written as something
 * else. A refine companion is code and is not run. `{ validate: false }` skips the check for
 * a caller that has validated already; the writer then emits whatever it is given.
 * @param shape - The template's shape, from `parseTemplate(...).shape`.
 * @param data - The document's data, in the form `ParsedTemplate.parse` returns.
 * @param options - `validate`: check the data first; defaults to `true`.
 * @returns The markdown text, ending with one newline.
 * @failure Invalid data throws an `Error` listing every failure; a value that cannot sit on one line throws too.
 */
export function generateDocument(
  shape: TemplateShape,
  data: DocumentData,
  options?: { validate?: boolean },
): string {
  if (options?.validate !== false) {
    const issues = validateDocumentData(shape, data);
    if (issues.length > 0) throw new Error(`Invalid document data:\n- ${issues.join('\n- ')}`);
  }
  return serializeTree(buildDocumentTree(shape, data, writeDataText));
}
