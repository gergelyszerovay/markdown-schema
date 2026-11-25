/** A `##` section the template does not declare, parsed as free text when the template is `open`. */
export type AdditionalSection = {
  /** The section's key, derived from its heading (`headingToKey`). */
  key: string;
  /** The H2 heading text, as written in the document. */
  heading: string;
  /** The section body as one markdown string. */
  text: string;
};

/**
 * A parsed document: the named parts the engine always extracts, plus one
 * `SectionValue` per declared section under its key from the template's shape. The
 * object is flat — section values sit beside `title`, not nested.
 *
 * The index signature is `unknown` so that an object literal with any frontmatter
 * (booleans, numbers, nested values) is assignable; read a section by narrowing its value
 * to the `SectionValue` member its kind in the shape names.
 */
export type DocumentData = {
  /** The document's YAML frontmatter, when it has one. */
  frontmatter?: unknown;
  /** The H1 title text; absent when the template declares no title. */
  title?: string;
  /** The `>` summary under the title; present only when the template declares the summary directive. */
  summary?: string;
  /** The undeclared sections of an `open` template, in document order; absent when there are none. */
  additionalSections?: AdditionalSection[];
  /** One `SectionValue` per declared section, under the section's key. */
  [section: string]: unknown;
};
