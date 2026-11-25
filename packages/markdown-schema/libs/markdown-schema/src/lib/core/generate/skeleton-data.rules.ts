import type { DocumentData } from '../doc-schema/document-data.model.ts';
import type {
  SectionBodyShape,
  TemplateShape,
  TitleShape,
} from '../template/template-shape.model.ts';

/** The placeholder a skeleton writes where a value goes. */
const PLACEHOLDER = '<...>';

/**
 * The title placeholder, written from the title's parts: the literal prefix, then a
 * placeholder for the field, the choices of an enum, or nothing for a literal title.
 * @param title - The title's shape.
 * @returns The title text of the skeleton.
 */
function titlePlaceholder(title: TitleShape): string {
  const prefix = `${title.prefix ?? ''}${title.separator ?? ''}`;
  switch (title.kind) {
    case 'literal':
      return title.prefix ?? PLACEHOLDER;
    case 'enum':
      return `${prefix}<${(title.choices ?? []).join(' | ')}>`;
    case 'field':
    case 'pascal-case':
      return `${prefix}${PLACEHOLDER}`;
    case undefined:
      return PLACEHOLDER;
  }
}

/**
 * The placeholder value of one section: one table row, one list item or one group.
 * @param body - The section body's shape.
 * @returns The section's value in the form `parse` returns.
 */
function sectionPlaceholder(body: SectionBodyShape): unknown {
  switch (body.kind) {
    case 'freetext':
      return PLACEHOLDER;
    case 'table':
      return [
        Object.fromEntries(
          body.columns.map((column) => [
            column.header,
            column.kind === 'checkbox' ? false : (column.defaultValue ?? `<${column.header}>`),
          ]),
        ),
      ];
    case 'labeled-list':
      return Object.fromEntries(
        body.fields.map((field) => [field.label, field.defaultValue ?? `<${field.label}>`]),
      );
    case 'task-list':
      return [{ checked: false, text: PLACEHOLDER }];
    case 'plain-list':
      return [PLACEHOLDER];
    case 'repeated-groups':
      return [{ heading: PLACEHOLDER, items: [PLACEHOLDER] }];
  }
}

/**
 * Builds the placeholder data of a template's skeleton: a title and summary placeholder when
 * the shape declares them, and one placeholder value per declared section, optional ones
 * included. The data need not validate.
 * @param shape - The template's shape.
 * @returns Data in the form `parse` returns, made of placeholders.
 */
export function skeletonData(shape: TemplateShape): DocumentData {
  const data: DocumentData = {};
  if (shape.title) data.title = titlePlaceholder(shape.title);
  if (shape.summary) data.summary = PLACEHOLDER;
  for (const section of shape.sections) data[section.key] = sectionPlaceholder(section.body);
  return data;
}
