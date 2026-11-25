/**
 * The shape of a template: everything its directives declare, as plain data. `parseTemplate`
 * infers the shape first and compiles the validation schema from it, so the shape is the
 * single source of truth for what a template requires; `templateJsonSchema` walks the same
 * shape into a JSON Schema. Refine companions are code and are not part of the shape.
 */
export type TemplateShape = {
  /** `document; open`: a section the template does not declare is parsed into `additionalSections`. */
  open: boolean;
  /** `document; unordered`: the declared sections may appear in any order. */
  unordered: boolean;
  /** The H1 title's constraint; absent when the template has no H1, and the parse output then has no `title`. */
  title?: TitleShape;
  /** The `>` summary directive between the H1 and the first section, when the template declares one. */
  summary?: SummaryShape;
  /** One entry per declared `##` section, in template order. */
  sections: SectionShape[];
};

/**
 * How a document's H1 title is constrained. `pattern` is the validator (the whole title must
 * match it); the other members carry the parts it was composed from, so a skeleton can write
 * the title placeholder without parsing the pattern back.
 */
export type TitleShape = {
  /** Source of the regular expression the whole title must match; absent means any non-empty title. */
  pattern?: string;
  /** The message reported when the title does not match `pattern`. */
  message?: string;
  /**
   * What follows the literal prefix: `literal` (the title is the prefix alone), `field` (a
   * field directive, optionally with `regex`), `enum` (one of `choices`) or `pascal-case`
   * (a bare placeholder). Absent when the title is a bare placeholder with no prefix.
   */
  kind?: 'literal' | 'field' | 'enum' | 'pascal-case';
  /** The literal text before the placeholder, trimmed (`CR-`); absent when there is none. */
  prefix?: string;
  /** The text between the prefix and the placeholder: a single space, or empty (`CR-` has none). */
  separator?: string;
  /** Source of the `field` directive's regex, when it declares one. */
  regex?: string;
  /** The allowed suffixes of an `enum` title. */
  choices?: string[];
};

/** The `>` summary directive: a field directive inside a blockquote under the H1. */
export type SummaryShape = {
  /** The directive's kind; a summary is always a field directive. */
  kind: 'field';
  /** Whether a document must carry the summary blockquote. */
  required: boolean;
  /** Source of the regular expression the summary text must match, when the directive declares one. */
  pattern?: string;
};

/** One declared `##` section of a template. */
export type SectionShape = {
  /** The section's key in the parse output, derived from the heading (`headingToKey`). */
  key: string;
  /** The H2 heading text, as written in the template. */
  heading: string;
  /** Whether the whole section may be absent from a document. */
  optional: boolean;
  /** `remove-if Key=Value`: the section must be absent when the named labeled-list field has this value. */
  removeIf?: { key: string; value: string };
  /** What the section body holds, discriminated by `kind`. */
  body: SectionBodyShape;
};

/** The body of one section, discriminated by `kind`; each kind maps to one {@link SectionValue} member. */
export type SectionBodyShape =
  | {
      /** Free-form markdown, extracted as one string. */
      kind: 'freetext';
    }
  | {
      /** A GFM table, extracted as one record per row keyed by header. */
      kind: 'table';
      /** The table's columns in header order: the `row` directive's rules where the template declares one, else the header row's cells. */
      columns: ColumnShape[];
      /** Whether a `row` directive declares the columns' rules; when `false`, the columns come from the header row alone and any string cells are accepted. */
      declared: boolean;
      /** Minimum number of data rows (`min-rows`). */
      minRows?: number;
      /** Maximum number of data rows (`max-rows`). */
      maxRows?: number;
    }
  | {
      /** A bullet list of `Label: value` lines with field or enum directives, extracted as a keyed record. */
      kind: 'labeled-list';
      /** The declared fields, in declaration order. */
      fields: FieldShape[];
    }
  | {
      /** A GFM task list, extracted as `{ checked, text }` items. */
      kind: 'task-list';
      /** Minimum number of items (`min-items`). */
      minItems?: number;
      /** Maximum number of items (`max-items`). */
      maxItems?: number;
      /** Source of the regular expression each item's text must match (the section directive's `regex`). */
      pattern?: string;
    }
  | {
      /** A bullet list without directives, extracted as one string per item. */
      kind: 'plain-list';
    }
  | {
      /** Repeated H3 groups, extracted as `{ heading, items }` entries. */
      kind: 'repeated-groups';
      /** The constraint of each group's H3 heading, from its inline directive; absent means any non-empty heading. */
      heading?: GroupHeadingShape;
      /** Minimum number of groups (`min-groups`). */
      minGroups?: number;
      /** Maximum number of groups (`max-groups`). */
      maxGroups?: number;
    };

/** One column of a `row` directive. */
export type ColumnShape = {
  /** The column's header text, the key of each row record. */
  header: string;
  /** `text` is any string, `enum` one of `choices`, `checkbox` a `[ ]` / `[x]` cell read as a boolean. */
  kind: 'text' | 'enum' | 'checkbox';
  /** Whether a cell must be non-empty. */
  required: boolean;
  /** Whether the column's values identify rows: they are unique across the whole document. */
  key: boolean;
  /** Source of the regular expression a cell must match, when declared. */
  pattern?: string;
  /** The allowed values, when the column is an enum. */
  choices?: string[];
  /** The value an empty or absent cell is replaced with; a defaulted column is always present in the parse output. */
  defaultValue?: string;
};

/** One field of a labeled-list section. */
export type FieldShape = {
  /** The label before the colon, the key in the extracted record. */
  label: string;
  /** Whether the field must have a non-empty value. */
  required: boolean;
  /** Source of the regular expression the value must match, when declared. */
  pattern?: string;
  /** The allowed values, when the field is an enum. */
  choices?: string[];
  /** The value a blank or absent field is filled with; a defaulted field is always present in the parse output. */
  defaultValue?: string;
  /** `only-if Key=Value`: the field may only have a value when the named sibling field has this value. */
  onlyIf?: { key: string; value: string };
};

/** The inline directive of a repeated section's H3 headings. */
export type GroupHeadingShape = {
  /** Whether the heading value is required (an optional enum heading may be absent). */
  required: boolean;
  /** Source of the regular expression the heading must match, when declared. */
  pattern?: string;
  /** The allowed heading values, when the directive is an enum. */
  choices?: string[];
};
