import type { RootContent, List, Heading, Html, Table } from 'mdast';
import { extractDirectiveBody } from '../directive/extract-directive-body.rules.ts';
import { parseDirective } from '../directive/parse-directive.rules.ts';
import type { ColumnSpec } from '../directive/column-spec.model.ts';
import type { ParsedDirective } from '../directive/parsed-directive.model.ts';
import { parseBlockDirectives } from './parse-block-directives.rules.ts';
import { findDirective } from './find-directive.rules.ts';
import { collectItemDirectives } from '../directive/collect-item-directives.rules.ts';
import { isLabeledList } from './is-labeled-list.rules.ts';
import { isTaskList } from './is-task-list.rules.ts';
import { toString } from 'mdast-util-to-string';
import { DirectiveError } from '../directive/directive.error.ts';
import type {
  ColumnShape,
  FieldShape,
  GroupHeadingShape,
  SectionBodyShape,
} from './template-shape.model.ts';

/** What {@link inferSectionShape} reads out of one section of a template. */
export type SectionShapeInference = {
  /** The section body's shape. */
  body: SectionBodyShape;
  /** Whether the whole section may be absent from a document. */
  optional: boolean;
  /** `remove-if Key=Value` guard from a `section` directive, if present. */
  removeIf?: { key: string; value: string };
};

/**
 * Maps a labeled-list item's parsed directive to the published field shape.
 * @param label - The item's label text.
 * @param directive - The item's inline directive, or `null` when it has none.
 * @returns The field shape; a label without a directive is an unconstrained optional field.
 */
function toFieldShape(label: string, directive: ParsedDirective | null): FieldShape {
  if (directive === null) return { label, required: false };
  if (directive.kind === 'enum') {
    return { label, required: directive.required, choices: directive.choices };
  }
  if (directive.kind === 'field') {
    return {
      label,
      required: directive.required,
      pattern: directive.regex,
      defaultValue: directive.defaultValue,
      onlyIf: directive.onlyIf,
    };
  }
  throw new DirectiveError(
    `labeled-list item "${label}" only supports inline field or enum directives, got: ${directive.kind}`,
  );
}

/**
 * Maps a `row` directive's column spec to the published column shape.
 * @param header - The column's header text.
 * @param spec - The column's parsed spec.
 * @returns The column shape; the kind is `checkbox` or `enum` when the spec says so, else `text`.
 */
function toColumnShape(header: string, spec: ColumnSpec): ColumnShape {
  if (spec.checkbox) return { header, kind: 'checkbox', required: true, key: false };
  return {
    header,
    kind: spec.enumChoices ? 'enum' : 'text',
    required: spec.required,
    key: spec.key,
    pattern: spec.regex,
    choices: spec.enumChoices,
    defaultValue: spec.defaultValue,
  };
}

/**
 * Infers the shape of a single template section from its mdast body nodes: which kind the
 * section is and the constraints its directives declare. The counterpart
 * `compileSectionShape` turns the shape into the extractor and Zod schema, so this is the
 * "what the template says" half of the old `inferSection`.
 * @param nodes - The body nodes for the section (after the H2 heading).
 * @param heading - The heading text (used in error messages).
 * @returns The section's body shape, optionality and `remove-if` guard.
 */
export function inferSectionShape(nodes: RootContent[], heading: string): SectionShapeInference {
  const blockDirectives = parseBlockDirectives(nodes);

  if (findDirective(blockDirectives, 'document')) {
    throw new DirectiveError(
      `Section "${heading}": the document directive belongs between the title and the first section`,
    );
  }

  const sectionDir = findDirective(blockDirectives, 'section');
  const rowDir = findDirective(blockDirectives, 'row');
  const freetextDir = findDirective(blockDirectives, 'freetext');

  const optional =
    (sectionDir?.optional ?? rowDir?.sectionOptional ?? false) || (freetextDir?.optional ?? false);
  const removeIf = sectionDir?.removeIf;
  const hasItemRules =
    sectionDir !== undefined &&
    (sectionDir.minItems !== undefined ||
      sectionDir.maxItems !== undefined ||
      sectionDir.itemRegex !== undefined);

  // `min-items`, `max-items` and the item `regex` belong to task-list sections only; on any
  // other kind they would silently constrain nothing, so reject them.
  const build = (body: SectionBodyShape): SectionShapeInference => {
    if (hasItemRules && body.kind !== 'task-list') {
      throw new DirectiveError(
        `Section "${heading}": min-items, max-items and regex apply to task-list sections only`,
      );
    }
    return { body, optional, removeIf };
  };

  // Content nodes: everything that isn't a block html TEMPLATE-ONLY comment
  const contentNodes = nodes.filter((n) => {
    if (n.type !== 'html') return true;
    const body = extractDirectiveBody(n.value);
    return body === null;
  });

  // 0. Explicit freetext directive → free-form markdown string
  if (freetextDir) {
    if (rowDir) {
      throw new Error(`Section "${heading}" cannot use both 'freetext' and 'row' directives`);
    }
    return build({ kind: 'freetext' });
  }

  // 1. Sub-headings → repeated groups
  const hasSubHeadings = contentNodes.some((n): n is Heading => n.type === 'heading');
  if (hasSubHeadings) {
    // The first H3 may carry an inline directive that constrains every group's heading.
    let headingShape: GroupHeadingShape | undefined;
    const firstHeading = contentNodes.find((n): n is Heading => n.type === 'heading');
    if (firstHeading) {
      const inlineHtml = firstHeading.children.find((c): c is Html => c.type === 'html');
      if (inlineHtml) {
        const body = extractDirectiveBody(inlineHtml.value);
        if (body) {
          const dir = parseDirective(body);
          if (dir.kind === 'field') {
            headingShape = { required: dir.required, pattern: dir.regex };
          } else if (dir.kind === 'enum') {
            headingShape = { required: dir.required, choices: dir.choices };
          } else {
            throw new DirectiveError(
              `H3 sub-headings only support inline field or enum directives, got: ${dir.kind}`,
            );
          }
        }
      }
    }
    return build({
      kind: 'repeated-groups',
      heading: headingShape,
      minGroups: sectionDir?.minGroups,
      maxGroups: sectionDir?.maxGroups,
    });
  }

  // 2. Row directive + table → table section
  const hasTable = contentNodes.some((n) => n.type === 'table');
  if (rowDir || hasTable) {
    const tableNode = contentNodes.find((n): n is Table => n.type === 'table');
    const columns: ColumnShape[] = rowDir
      ? Object.entries(rowDir.columns).map(([header, spec]): ColumnShape =>
          toColumnShape(header, spec),
        )
      : (tableNode?.children[0]?.children ?? []).map((cell): ColumnShape => ({
          header: toString(cell).trim(),
          kind: 'text',
          required: false,
          key: false,
        }));
    return build({
      kind: 'table',
      columns,
      declared: rowDir !== undefined,
      minRows: rowDir?.minRows,
      maxRows: rowDir?.maxRows,
    });
  }

  // 3. Lists: task list, labeled bullet list, plain bullet list
  const listNode = contentNodes.find((n): n is List => n.type === 'list');
  if (listNode) {
    if (isTaskList(listNode)) {
      return build({
        kind: 'task-list',
        minItems: sectionDir?.minItems,
        maxItems: sectionDir?.maxItems,
        pattern: sectionDir?.itemRegex,
      });
    }
    const itemDirs = collectItemDirectives(listNode);
    if (isLabeledList(listNode)) {
      const fields = Object.entries(itemDirs).map(([label, dir]) => toFieldShape(label, dir));
      return build({ kind: 'labeled-list', fields });
    }
    return build({ kind: 'plain-list' });
  }

  // No recognized shape and no freetext directive → hard error
  throw new Error(
    `Section "${heading}" has no recognized shape; add a 'freetext' directive if free-form content is intended`,
  );
}
