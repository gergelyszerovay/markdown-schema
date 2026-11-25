import { compileUserRegex } from '../directive/compile-user-regex.rules.ts';
import type {
  ColumnShape,
  FieldShape,
  SectionBodyShape,
  SectionShape,
  TemplateShape,
} from '../template/template-shape.model.ts';

/** What a scalar must satisfy: the constraints of a column, a field, a heading or a title. */
type ScalarRule = { required: boolean; pattern?: string; choices?: string[] };

/**
 * Checks one scalar against its constraints, like the compiled schema checks a parsed value.
 * @param value - The value in the data.
 * @param rule - Its constraints.
 * @param where - What the value is, for the message.
 * @param issues - Where a failure is recorded.
 */
function checkScalar(value: unknown, rule: ScalarRule, where: string, issues: string[]): void {
  if (typeof value !== 'string') {
    issues.push(`${where}: expected a string, got ${describe(value)}`);
    return;
  }
  if (rule.choices) {
    if (!rule.choices.includes(value)) {
      issues.push(`${where}: expected one of ${rule.choices.map((c) => `"${c}"`).join(', ')}`);
    }
    return;
  }
  if (rule.required && value === '') issues.push(`${where}: must not be empty`);
  if (rule.pattern !== undefined && !compileUserRegex(rule.pattern, where).test(value)) {
    issues.push(`${where}: does not match the required format`);
  }
}

/**
 * Names a value's type for a message.
 * @param value - Any value.
 * @returns `null`, `array` or the `typeof` name.
 */
function describe(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'an array';
  return typeof value;
}

/**
 * Narrows a value to a plain object.
 * @param value - Any value.
 * @returns Whether it is a non-null, non-array object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks the size of a list against its declared bounds.
 * @param length - The list's length.
 * @param bounds - The declared minimum and maximum.
 * @param where - What the list is, for the message.
 * @param issues - Where a failure is recorded.
 */
function checkCount(
  length: number,
  bounds: { min?: number; max?: number },
  where: string,
  issues: string[],
): void {
  if (bounds.min && length < bounds.min)
    issues.push(`${where}: needs at least ${String(bounds.min)}`);
  if (bounds.max && length > bounds.max)
    issues.push(`${where}: allows at most ${String(bounds.max)}`);
}

/**
 * Checks the keys of a record: every declared one that is required is present, and no
 * undeclared one is.
 * @param record - The record in the data.
 * @param declared - The declared keys.
 * @param required - The keys that must be present.
 * @param where - What the record is, for the message.
 * @param issues - Where a failure is recorded.
 */
function checkKeys(
  record: Record<string, unknown>,
  declared: string[],
  required: string[],
  where: string,
  issues: string[],
): void {
  for (const key of required) {
    if (record[key] === undefined) issues.push(`${where}: "${key}" is required`);
  }
  for (const key of Object.keys(record)) {
    if (!declared.includes(key)) issues.push(`${where}: "${key}" is not declared`);
  }
}

/**
 * Checks one table row.
 * @param row - The row in the data.
 * @param columns - The table's columns.
 * @param declared - Whether a `row` directive declares the columns' rules.
 * @param where - What the row is, for the message.
 * @param issues - Where a failure is recorded.
 */
function checkRow(
  row: unknown,
  columns: ColumnShape[],
  declared: boolean,
  where: string,
  issues: string[],
): void {
  if (!isRecord(row)) {
    issues.push(`${where}: expected an object, got ${describe(row)}`);
    return;
  }
  if (!declared) {
    for (const [header, cell] of Object.entries(row)) {
      if (typeof cell !== 'string') {
        issues.push(`${where} cell "${header}": expected a string, got ${describe(cell)}`);
      }
    }
    return;
  }
  checkKeys(
    row,
    columns.map((column) => column.header),
    columns.filter((c) => c.required || c.defaultValue !== undefined).map((c) => c.header),
    where,
    issues,
  );
  for (const column of columns) {
    const cell = row[column.header];
    if (cell === undefined) continue;
    const cellWhere = `${where} cell "${column.header}"`;
    if (column.kind === 'checkbox') {
      if (typeof cell !== 'boolean') {
        issues.push(`${cellWhere}: expected true or false, got ${describe(cell)}`);
      }
    } else checkScalar(cell, column, cellWhere, issues);
  }
}

/**
 * Checks a labeled-list record, including each field's `only-if` condition.
 * @param value - The section's value in the data.
 * @param fields - The declared fields.
 * @param where - What the section is, for the message.
 * @param issues - Where a failure is recorded.
 */
function checkLabeledList(
  value: unknown,
  fields: FieldShape[],
  where: string,
  issues: string[],
): void {
  if (!isRecord(value)) {
    issues.push(`${where}: expected an object, got ${describe(value)}`);
    return;
  }
  checkKeys(
    value,
    fields.map((field) => field.label),
    fields.filter((f) => f.required || f.defaultValue !== undefined).map((f) => f.label),
    where,
    issues,
  );
  for (const field of fields) {
    const fieldValue = value[field.label];
    if (fieldValue === undefined) continue;
    const fieldWhere = `${where} field "${field.label}"`;
    checkScalar(fieldValue, { ...field, required: true }, fieldWhere, issues);
    if (field.onlyIf && value[field.onlyIf.key] !== field.onlyIf.value) {
      issues.push(`${fieldWhere}: only allowed when ${field.onlyIf.key}=${field.onlyIf.value}`);
    }
  }
}

/**
 * Checks one section's value by the body's kind.
 * @param body - The section body's shape.
 * @param value - The section's value in the data.
 * @param heading - The section's heading, for the message.
 * @param issues - Where a failure is recorded.
 */
function checkSection(
  body: SectionBodyShape,
  value: unknown,
  heading: string,
  issues: string[],
): void {
  const where = `Section "${heading}"`;
  if (body.kind === 'freetext') {
    checkScalar(value, { required: true }, where, issues);
    return;
  }
  if (body.kind === 'labeled-list') {
    checkLabeledList(value, body.fields, where, issues);
    return;
  }
  if (!Array.isArray(value)) {
    issues.push(`${where}: expected an array, got ${describe(value)}`);
    return;
  }
  const list: unknown[] = value;
  switch (body.kind) {
    case 'table':
      checkCount(list.length, { min: body.minRows, max: body.maxRows }, where, issues);
      list.forEach((row, index) => {
        checkRow(row, body.columns, body.declared, `${where} row ${String(index + 1)}`, issues);
      });
      return;
    case 'task-list':
      checkCount(list.length, { min: body.minItems, max: body.maxItems }, where, issues);
      list.forEach((entry, index) => {
        const entryWhere = `${where} item ${String(index + 1)}`;
        if (!isRecord(entry)) {
          issues.push(`${entryWhere}: expected an object, got ${describe(entry)}`);
          return;
        }
        checkKeys(entry, ['checked', 'text'], ['checked', 'text'], entryWhere, issues);
        if (entry.checked !== undefined && typeof entry.checked !== 'boolean') {
          issues.push(
            `${entryWhere} "checked": expected true or false, got ${describe(entry.checked)}`,
          );
        }
        if (entry.text !== undefined) {
          checkScalar(
            entry.text,
            { required: false, pattern: body.pattern },
            `${entryWhere} text`,
            issues,
          );
        }
      });
      return;
    case 'plain-list':
      list.forEach((entry, index) => {
        checkScalar(entry, { required: false }, `${where} item ${String(index + 1)}`, issues);
      });
      return;
    case 'repeated-groups':
      checkCount(list.length, { min: body.minGroups, max: body.maxGroups }, where, issues);
      list.forEach((group, index) => {
        const groupWhere = `${where} group ${String(index + 1)}`;
        if (!isRecord(group)) {
          issues.push(`${groupWhere}: expected an object, got ${describe(group)}`);
          return;
        }
        const headingRequired = !body.heading || body.heading.required;
        checkKeys(
          group,
          ['heading', 'items'],
          headingRequired ? ['heading', 'items'] : ['items'],
          groupWhere,
          issues,
        );
        if (group.heading !== undefined) {
          checkScalar(
            group.heading,
            { ...body.heading, required: true },
            `${groupWhere} heading`,
            issues,
          );
        }
        if (group.items !== undefined) {
          if (!Array.isArray(group.items)) {
            issues.push(`${groupWhere} items: expected an array, got ${describe(group.items)}`);
          } else {
            (group.items as unknown[]).forEach((item, itemIndex) => {
              checkScalar(
                item,
                { required: false },
                `${groupWhere} item ${String(itemIndex + 1)}`,
                issues,
              );
            });
          }
        }
      });
      return;
  }
}

/**
 * Checks the conditional rules that hold on top of the structure: a `remove-if` section is
 * absent when its guard field has the guarded value, and a `key` column's values are unique
 * across the document.
 * @param shape - The template's shape.
 * @param data - The document's data.
 * @param issues - Where a failure is recorded.
 */
function checkConditions(
  shape: TemplateShape,
  data: Record<string, unknown>,
  issues: string[],
): void {
  for (const section of shape.sections) {
    if (!section.removeIf || data[section.key] === undefined) continue;
    const { key: label, value } = section.removeIf;
    for (const owner of shape.sections) {
      if (owner.body.kind !== 'labeled-list' || !owner.body.fields.some((f) => f.label === label)) {
        continue;
      }
      const record = data[owner.key];
      if (isRecord(record) && record[label] === value) {
        issues.push(`Section "${section.heading}" must be removed when ${label}=${value}`);
      }
    }
  }
  const seen = new Set<string>();
  for (const section of shape.sections) {
    if (section.body.kind !== 'table' || !Array.isArray(data[section.key])) continue;
    for (const column of section.body.columns.filter((c) => c.key)) {
      for (const row of data[section.key] as unknown[]) {
        const cell = isRecord(row) ? row[column.header] : undefined;
        if (typeof cell !== 'string' || cell === '') continue;
        if (seen.has(cell)) {
          issues.push(
            `Section "${section.heading}" cell "${column.header}": duplicate key "${cell}"`,
          );
        }
        seen.add(cell);
      }
    }
  }
}

/**
 * Validates a document's data against a template's shape, in the form `parse` returns: the
 * structural contract of the JSON Schema walker plus the conditional rules (`only-if`,
 * `remove-if`, unique `key` values). Refine companions are code and are not run.
 * @param shape - The template's shape, from `parseTemplate(...).shape`.
 * @param data - The document's data.
 * @returns The failures, each naming the section and field; empty when the data validates.
 */
export function validateDocumentData(shape: TemplateShape, data: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(data)) return [`The data: expected an object, got ${describe(data)}`];

  const declared = ['frontmatter', ...shape.sections.map((s) => s.key)];
  if (shape.title) declared.push('title');
  if (shape.summary) declared.push('summary');
  if (shape.open) declared.push('additionalSections');
  for (const key of Object.keys(data)) {
    if (!declared.includes(key)) issues.push(`The data: "${key}" is not declared by the template`);
  }

  if (shape.title) {
    if (data.title === undefined) issues.push('The title: is required');
    else
      checkScalar(
        data.title,
        { required: true, pattern: shape.title.pattern },
        'The title',
        issues,
      );
  }
  if (shape.summary) {
    if (data.summary === undefined) {
      if (shape.summary.required) issues.push('The summary: is required');
    } else {
      checkScalar(
        data.summary,
        { required: true, pattern: shape.summary.pattern },
        'The summary',
        issues,
      );
    }
  }
  for (const section of shape.sections satisfies SectionShape[]) {
    const value = data[section.key];
    if (value === undefined) {
      if (!section.optional) issues.push(`Section "${section.heading}": is required`);
    } else checkSection(section.body, value, section.heading, issues);
  }
  if (shape.open && data.additionalSections !== undefined) {
    const extras = data.additionalSections;
    if (!Array.isArray(extras)) {
      issues.push(`The additional sections: expected an array, got ${describe(extras)}`);
    } else {
      (extras as unknown[]).forEach((extra, index) => {
        const where = `Additional section ${String(index + 1)}`;
        if (!isRecord(extra)) {
          issues.push(`${where}: expected an object, got ${describe(extra)}`);
          return;
        }
        checkKeys(extra, ['key', 'heading', 'text'], ['key', 'heading', 'text'], where, issues);
        for (const member of ['key', 'heading', 'text']) {
          if (extra[member] !== undefined && typeof extra[member] !== 'string') {
            issues.push(`${where} "${member}": expected a string, got ${describe(extra[member])}`);
          }
        }
      });
    }
  }
  checkConditions(shape, data, issues);
  return issues;
}
