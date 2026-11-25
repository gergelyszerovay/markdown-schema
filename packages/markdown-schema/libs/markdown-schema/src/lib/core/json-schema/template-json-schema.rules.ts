import type {
  ColumnShape,
  FieldShape,
  SectionBodyShape,
  TemplateShape,
} from '../template/template-shape.model.ts';

/** A JSON Schema (draft 2020-12), as plain data. */
export type TemplateJsonSchema = Record<string, unknown>;

/**
 * The schema of one scalar value from its constraints, mirroring how the shape compiles to
 * zod: an enum lists its choices, a required value is non-empty, and a declared regex is
 * the value's pattern.
 * @param value - The value's constraints.
 * @returns The JSON Schema of the value.
 */
function valueSchema(value: {
  required: boolean;
  pattern?: string;
  choices?: string[];
}): TemplateJsonSchema {
  if (value.choices) return { type: 'string', enum: value.choices };
  const schema: TemplateJsonSchema = { type: 'string' };
  if (value.required) schema.minLength = 1;
  if (value.pattern !== undefined) schema.pattern = value.pattern;
  return schema;
}

/**
 * The schema of a table's row objects.
 * @param body - The table's columns, and whether a `row` directive declares their rules; an undeclared table accepts any string cells.
 * @returns The JSON Schema of one row.
 */
function rowSchema(body: { columns: ColumnShape[]; declared: boolean }): TemplateJsonSchema {
  if (!body.declared) return { type: 'object', additionalProperties: { type: 'string' } };
  const properties: Record<string, TemplateJsonSchema> = {};
  const required: string[] = [];
  for (const column of body.columns) {
    properties[column.header] =
      column.kind === 'checkbox' ? { type: 'boolean' } : valueSchema(column);
    // A defaulted column is filled in the parse output, so it is always present there.
    if (column.required || column.defaultValue !== undefined) required.push(column.header);
  }
  return { type: 'object', properties, required, additionalProperties: false };
}

/**
 * The schema of a labeled-list section's record. Blank optional fields are left out of
 * emitted JSON, so a present value is always a non-empty string. `only-if` conditions are
 * not represented: the schema documents the structural contract only.
 * @param fields - The section's declared fields.
 * @returns The JSON Schema of the record.
 */
function labeledListSchema(fields: FieldShape[]): TemplateJsonSchema {
  const properties: Record<string, TemplateJsonSchema> = {};
  const required: string[] = [];
  for (const field of fields) {
    properties[field.label] = valueSchema({ ...field, required: true });
    // A defaulted field is filled in the parse output, so it is always present there.
    if (field.required || field.defaultValue !== undefined) required.push(field.label);
  }
  return { type: 'object', properties, required, additionalProperties: false };
}

/**
 * The schema of one section's value, by the body's kind (see `SectionValue`).
 * @param body - The section body's shape.
 * @returns The JSON Schema of the section's value.
 */
function sectionSchema(body: SectionBodyShape): TemplateJsonSchema {
  switch (body.kind) {
    case 'freetext':
      return { type: 'string', minLength: 1 };
    case 'table': {
      const schema: TemplateJsonSchema = { type: 'array', items: rowSchema(body) };
      if (body.minRows !== undefined) schema.minItems = body.minRows;
      if (body.maxRows !== undefined) schema.maxItems = body.maxRows;
      return schema;
    }
    case 'labeled-list':
      return labeledListSchema(body.fields);
    case 'task-list': {
      const text: TemplateJsonSchema = { type: 'string' };
      if (body.pattern !== undefined) text.pattern = body.pattern;
      const schema: TemplateJsonSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: { checked: { type: 'boolean' }, text },
          required: ['checked', 'text'],
          additionalProperties: false,
        },
      };
      if (body.minItems !== undefined) schema.minItems = body.minItems;
      if (body.maxItems !== undefined) schema.maxItems = body.maxItems;
      return schema;
    }
    case 'plain-list':
      return { type: 'array', items: { type: 'string' } };
    case 'repeated-groups': {
      const heading = body.heading
        ? valueSchema({ ...body.heading, required: true })
        : { type: 'string', minLength: 1 };
      const group: TemplateJsonSchema = {
        type: 'object',
        properties: { heading, items: { type: 'array', items: { type: 'string' } } },
        required: body.heading && !body.heading.required ? ['items'] : ['heading', 'items'],
        additionalProperties: false,
      };
      const schema: TemplateJsonSchema = { type: 'array', items: group };
      if (body.minGroups !== undefined) schema.minItems = body.minGroups;
      if (body.maxGroups !== undefined) schema.maxItems = body.maxGroups;
      return schema;
    }
  }
}

/**
 * Walks a template's shape into one JSON Schema (draft 2020-12) describing the
 * `DocumentData` the template's `parse` emits: the title and summary strings, one property
 * per declared section under its key, and `additionalSections` when the template is open.
 *
 * The schema documents the structural contract only. What lives outside the shape is not
 * represented: refine companions are code, and the conditional rules (`only-if`,
 * `remove-if`, the cross-document uniqueness of `key` columns) hold on top of the
 * structure the schema describes.
 *
 * The schema also says what it describes, so a reader that sees only the schema (a model
 * filling it) knows the document and its parts: each section's schema carries a
 * `description` from its heading, and when the caller names the template, the root carries
 * `title`, `description` and an `$id` (`urn:markdown-schema:template:<name>`).
 * @param shape - The template's shape, from `parseTemplate(...).shape`.
 * @param identity - `name`: the template's name, as `templateNameOf` reads it from the file name.
 * @returns The JSON Schema, as plain data ready to serialize.
 */
export function templateJsonSchema(
  shape: TemplateShape,
  identity?: { name: string },
): TemplateJsonSchema {
  // `true` is the boolean JSON Schema that accepts anything.
  const properties: Record<string, TemplateJsonSchema | true> = {};
  const required: string[] = [];

  // Frontmatter is always permitted and unconstrained (see defineDocSchema).
  properties.frontmatter = true;

  if (shape.title) {
    properties.title = shape.title.pattern
      ? { type: 'string', pattern: shape.title.pattern }
      : { type: 'string', minLength: 1 };
    required.push('title');
  }

  if (shape.summary) {
    const summary: TemplateJsonSchema = { type: 'string', minLength: 1 };
    if (shape.summary.pattern !== undefined) summary.pattern = shape.summary.pattern;
    properties.summary = summary;
    if (shape.summary.required) required.push('summary');
  }

  for (const section of shape.sections) {
    properties[section.key] = {
      description: `The "${section.heading}" section${section.optional ? ' (optional)' : ''}.`,
      ...sectionSchema(section.body),
    };
    if (!section.optional) required.push(section.key);
  }

  if (shape.open) {
    properties.additionalSections = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          heading: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['key', 'heading', 'text'],
        additionalProperties: false,
      },
    };
  }

  const identified: TemplateJsonSchema = identity
    ? {
        $id: `urn:markdown-schema:template:${encodeURIComponent(identity.name)}`,
        title: identity.name,
        description: `The data of a "${identity.name}" document, as its template's parser returns it.`,
      }
    : {};
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    ...identified,
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  };
}
