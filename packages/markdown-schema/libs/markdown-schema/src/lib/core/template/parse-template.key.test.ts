import { describe, expect, it } from 'vitest';
import { DirectiveError } from '../directive/directive.error.ts';
import { listRowKeys } from './list-row-keys.rules.ts';
import { parseTemplate } from './parse-template.rules.ts';

const template = `# Doc

## Requirements

<!-- TEMPLATE-ONLY: row
ID: string; key; regex \`^R\\d+$\`
Text: string; required
-->

| ID | Text |
| -- | ---- |
| R1 | text |

## Decisions

<!-- TEMPLATE-ONLY: row
ID: string; key; regex \`^D\\d+$\`
Decision: string; required
-->

| ID | Decision |
| -- | -------- |
| D1 | text     |
`;

/**
 * Builds a document against {@link template}.
 * @param requirements - The ID cells of the requirements table.
 * @param decisions - The ID cells of the decisions table.
 * @returns The document text.
 */
function document(requirements: string[], decisions: string[]): string {
  const rows = (ids: string[], text: string): string =>
    ids.map((id) => `| ${id} | ${text} |`).join('\n');
  return `# Doc

## Requirements

| ID | Text |
| -- | ---- |
${rows(requirements, 'a')}

## Decisions

| ID | Decision |
| -- | -------- |
${rows(decisions, 'b')}
`;
}

describe('the key column modifier', () => {
  it(
    'a key column is reported with its section, heading and header',
    { tags: ['invariant'], meta: { spec: 'key-column-is-reported' } },
    () => {
      const schema = parseTemplate(template);
      expect(schema.keyColumns).toEqual([
        { section: 'requirements', heading: 'Requirements', column: 'ID' },
        { section: 'decisions', heading: 'Decisions', column: 'ID' },
      ]);
    },
  );

  it(
    'a parsed document lists its row keys with the field of each row',
    { tags: ['invariant'], meta: { spec: 'key-column-lists-row-keys' } },
    () => {
      const schema = parseTemplate(template);
      const data = schema.parse(document(['R1', 'R2'], ['D1']));
      expect(listRowKeys(data, schema.keyColumns)).toEqual([
        { key: 'R1', section: 'requirements', column: 'ID', field: 'requirements[R1]' },
        { key: 'R2', section: 'requirements', column: 'ID', field: 'requirements[R2]' },
        { key: 'D1', section: 'decisions', column: 'ID', field: 'decisions[D1]' },
      ]);
    },
  );

  it(
    'a duplicate key within one table is a validation error',
    { tags: ['invariant'], meta: { spec: 'key-column-duplicate-in-one-table' } },
    () => {
      const schema = parseTemplate(template);
      expect(() => schema.parse(document(['R1', 'R1'], ['D1']))).toThrow(/Duplicate key .*R1/);
    },
  );

  it(
    'a key shared by two tables is a validation error',
    { tags: ['invariant'], meta: { spec: 'key-column-duplicate-across-tables' } },
    () => {
      const shared = parseTemplate(template.replaceAll('^R', '^[RD]'));
      expect(() => shared.parse(document(['D1'], ['D1']))).toThrow(/Duplicate key .*D1/);
    },
  );

  it(
    'an empty key cell is a validation error',
    { tags: ['invariant'], meta: { spec: 'key-column-empty-key' } },
    () => {
      const schema = parseTemplate(template);
      expect(() => schema.parse(document(['R1', ''], ['D1']))).toThrow();
    },
  );

  it(
    'key combined with optional is a template error',
    { tags: ['invariant'], meta: { spec: 'key-column-with-optional-is-rejected' } },
    () => {
      const broken = template.replace('string; key;', 'string; key; optional;');
      expect(() => parseTemplate(broken)).toThrow(DirectiveError);
      expect(() => parseTemplate(broken)).toThrow(/'key' and 'optional'/);
    },
  );

  it(
    'a template without key columns reports none',
    { tags: ['invariant'], meta: { spec: 'key-column-none-declared' } },
    () => {
      const plain = parseTemplate(template.replaceAll('string; key;', 'string;'));
      expect(plain.keyColumns).toEqual([]);
    },
  );
});
