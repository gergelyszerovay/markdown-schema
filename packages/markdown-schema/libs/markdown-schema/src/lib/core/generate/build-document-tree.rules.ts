import type { PhrasingContent, Root, RootContent, TableCell, TableRow } from 'mdast';
import { stringify as stringifyYaml } from 'yaml';
import type { DocumentData } from '../doc-schema/document-data.model.ts';
import { absentCell } from './serialize-tree.rules.ts';
import type {
  ColumnShape,
  SectionBodyShape,
  TemplateShape,
} from '../template/template-shape.model.ts';

/** The table member of {@link SectionBodyShape}. */
type TableBodyShape = Extract<SectionBodyShape, { kind: 'table' }>;

/** Writes a string into the document as inline content: escaped text for data, raw html for a skeleton's placeholders. */
export type WriteText = (value: string) => PhrasingContent[];

/**
 * Rejects a value that cannot sit on one line (a title, a table cell, a list item).
 * @param value - The value to write.
 * @param where - What the value is, for the message.
 * @returns The value, unchanged.
 */
function inline(value: string, where: string): string {
  if (/[\r\n]/.test(value)) throw new Error(`${where} cannot contain a line break`);
  return value;
}

/**
 * Narrows a section's value to an array.
 * @param value - The section's value in the data.
 * @param heading - The section's heading, for the message.
 * @returns The array.
 */
function arrayOf(value: unknown, heading: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`Section "${heading}": expected an array`);
  return value as unknown[];
}

/**
 * Builds a bullet list node.
 * @param items - The list items' inline content.
 * @param checked - Per item, the task-list state, or `undefined` for a plain list.
 * @returns The list node.
 */
function listOf(items: PhrasingContent[][], checked?: boolean[]): RootContent {
  return {
    type: 'list',
    ordered: false,
    spread: false,
    children: items.map((children, index) => ({
      type: 'listItem',
      spread: false,
      checked: checked ? (checked[index] ?? false) : null,
      children: [{ type: 'paragraph', children }],
    })),
  };
}

/**
 * Builds a heading node.
 * @param depth - The heading depth.
 * @param children - The heading's inline content.
 * @returns The heading node.
 */
function headingOf(depth: 2 | 3, children: PhrasingContent[]): RootContent {
  return { type: 'heading', depth, children };
}

/**
 * Builds a GFM table node. The header cells are plain text; a `checkbox` column's cells are
 * written raw as `[ ]` / `[x]`, so they are not escaped.
 * @param shape - The table section's shape: its columns in header order, and whether a `row` directive declares them.
 * @param rows - The row records of the data.
 * @param write - How string values are written.
 * @param heading - The section's heading, for messages.
 * @returns The table node.
 */
function tableOf(
  shape: TableBodyShape,
  rows: unknown[],
  write: WriteText,
  heading: string,
): RootContent {
  const records = rows.map((row) => row as Record<string, unknown>);
  let columns = shape.columns;
  if (!shape.declared && records.length > 0) {
    // An undeclared table accepts any headers, so the data's own keys are the header row.
    const seen = new Set<string>();
    for (const record of records) for (const key of Object.keys(record)) seen.add(key);
    columns = [...seen].map((header): ColumnShape => ({
      header,
      kind: 'text',
      required: false,
      key: false,
    }));
  }
  const cell = (children: PhrasingContent[]): TableCell => ({ type: 'tableCell', children });
  const head: TableRow = {
    type: 'tableRow',
    children: columns.map((column) =>
      cell(write(inline(column.header, `Section "${heading}" header`))),
    ),
  };
  const body = records.map((record): TableRow => {
    // A cell absent from the data is left out when nothing follows it, so a row with fewer
    // cells than headers parses back without that key; one followed by a cell is written
    // empty and parses back as an empty string.
    let last = columns.length - 1;
    while (last >= 0) {
      const column = columns[last];
      if (
        column !== undefined &&
        column.kind !== 'checkbox' &&
        record[column.header] === undefined
      ) {
        last -= 1;
      } else break;
    }
    return {
      type: 'tableRow',
      children: columns.map((column, index) => {
        const value = record[column.header];
        if (index > last) return cell([{ type: 'html', value: absentCell }]);
        if (column.kind === 'checkbox') {
          return cell([{ type: 'html', value: value === true ? '[x]' : '[ ]' }]);
        }
        if (typeof value !== 'string' || value === '') return cell([]);
        return cell(write(inline(value, `Section "${heading}" cell "${column.header}"`)));
      }),
    };
  });
  return { type: 'table', children: [head, ...body] };
}

/**
 * Builds the nodes of one section's body from its value.
 * @param body - The section body's shape.
 * @param value - The section's value in the data.
 * @param write - How string values are written.
 * @param heading - The section's heading, for messages.
 * @returns The body nodes, in order.
 */
function bodyNodes(
  body: SectionBodyShape,
  value: unknown,
  write: WriteText,
  heading: string,
): RootContent[] {
  switch (body.kind) {
    case 'freetext':
      // Raw, so the text the data holds is the text the document carries.
      return typeof value === 'string' && value !== '' ? [{ type: 'html', value }] : [];
    case 'table':
      return [tableOf(body, arrayOf(value, heading), write, heading)];
    case 'labeled-list': {
      const record = (value ?? {}) as Record<string, unknown>;
      const items: PhrasingContent[][] = [];
      for (const field of body.fields) {
        const fieldValue = record[field.label];
        if (typeof fieldValue !== 'string' || fieldValue === '') continue;
        items.push(write(`${field.label}: ${fieldValue}`));
      }
      return items.length > 0 ? [listOf(items)] : [];
    }
    case 'task-list': {
      const entries = arrayOf(value, heading) as { checked: boolean; text: string }[];
      return [
        listOf(
          entries.map((entry) => write(entry.text)),
          entries.map((entry) => entry.checked),
        ),
      ];
    }
    case 'plain-list': {
      const entries = arrayOf(value, heading) as string[];
      return [listOf(entries.map((entry) => write(entry)))];
    }
    case 'repeated-groups': {
      const groups = arrayOf(value, heading) as { heading: string; items: string[] }[];
      return groups.flatMap((group): RootContent[] => [
        headingOf(3, write(inline(group.heading, `Section "${heading}" group heading`))),
        listOf(group.items.map((item) => write(item))),
      ]);
    }
  }
}

/**
 * Builds the mdast tree of a document from a template's shape and data: the frontmatter,
 * the H1 title, the `>` summary, each declared section in template order, then the
 * `additionalSections` of an open template. A section absent from the data is left out.
 * Soft line breaks are kept in list items; a title, summary, heading or table cell cannot hold one. The tree carries no positions; `serializeTree` writes it as markdown.
 * @param shape - The template's shape.
 * @param data - The document's data, in the form `parse` returns.
 * @param write - How string values are written: escaped text for data, raw html for a skeleton's placeholders.
 * @returns The document's tree.
 */
export function buildDocumentTree(
  shape: TemplateShape,
  data: DocumentData,
  write: WriteText,
): Root {
  const children: RootContent[] = [];

  if (data.frontmatter !== undefined) {
    // A raw block: the serializer needs no frontmatter extension (the domain layer may not import one).
    children.push({
      type: 'html',
      value: `---\n${stringifyYaml(data.frontmatter).trimEnd()}\n---`,
    });
  }
  if (shape.title && typeof data.title === 'string') {
    children.push({
      type: 'heading',
      depth: 1,
      children: write(inline(data.title, 'The title')),
    });
  }
  if (shape.summary && typeof data.summary === 'string') {
    children.push({
      type: 'blockquote',
      children: [{ type: 'paragraph', children: write(inline(data.summary, 'The summary')) }],
    });
  }
  for (const section of shape.sections) {
    const value = data[section.key];
    if (value === undefined) continue;
    children.push(
      headingOf(2, write(inline(section.heading, 'A section heading'))),
      ...bodyNodes(section.body, value, write, section.heading),
    );
  }
  if (shape.open && Array.isArray(data.additionalSections)) {
    for (const extra of data.additionalSections) {
      children.push(
        headingOf(2, write(inline(extra.heading, 'A section heading'))),
        ...(extra.text === '' ? [] : [{ type: 'html' as const, value: extra.text }]),
      );
    }
  }
  return { type: 'root', children };
}
