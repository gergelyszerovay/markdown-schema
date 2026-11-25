import { describe, expect, it } from 'vitest';
import { parseTemplate } from './parse-template.rules.ts';
import type { TitleShape } from './template-shape.model.ts';

const template = `# Spec: <!-- TEMPLATE-ONLY: string; regex \`^[a-z-]+$\`; required -->

> <!-- TEMPLATE-ONLY: string; required; regex \`^[^\\n]{10,200}$\` -->

<!-- TEMPLATE-ONLY: document; open; unordered -->

## Rules

| ID  | Rule | Checked by |
| --- | ---- | ---------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1; max-rows: 9
ID: string; key; regex \`^R[1-9][0-9]*$\`
Rule: string; required
Checked by: enum: spec | review; default=review
-->

| R1 | A rule. | spec |

## Identity

- Kind: <!-- TEMPLATE-ONLY: enum: skill | product; required -->
- Version: <!-- TEMPLATE-ONLY: string; optional; regex \`^\\d+\\.\\d+\\.\\d+$\` -->

## Steps

<!-- TEMPLATE-ONLY: section; optional -->

- [ ] a step

## Links

<!-- TEMPLATE-ONLY: section; optional; remove-if Kind=skill -->

- a plain item

## Changes

<!-- TEMPLATE-ONLY: section; min-groups: 1 -->

### <!-- TEMPLATE-ONLY: string; regex \`^(add|fix): .+$\`; required -->

- one item

## Notes

<!-- TEMPLATE-ONLY: freetext; optional -->

Prose.
`;

describe('the template shape', () => {
  it(
    'parseTemplate publishes the shape every directive declares',
    { tags: ['invariant'], meta: { spec: 'parse-template-publishes-the-template-shape' } },
    () => {
      const { shape } = parseTemplate(template);
      expect(shape.open).toBe(true);
      expect(shape.unordered).toBe(true);
      expect(shape.title).toEqual({
        pattern: '^Spec: (?:[a-z-]+)$',
        message: "title must match 'Spec: <^[a-z-]+$>'",
        kind: 'field',
        prefix: 'Spec:',
        separator: ' ',
        regex: '^[a-z-]+$',
      });
      expect(shape.summary).toEqual({ kind: 'field', required: true, pattern: '^[^\\n]{10,200}$' });
      expect(shape.sections.map((s) => [s.key, s.body.kind, s.optional])).toEqual([
        ['rules', 'table', false],
        ['identity', 'labeled-list', false],
        ['steps', 'task-list', true],
        ['links', 'plain-list', true],
        ['changes', 'repeated-groups', false],
        ['notes', 'freetext', true],
      ]);
    },
  );

  it(
    'a table section shape carries its columns, keys, bounds and defaults',
    { tags: ['invariant'], meta: { spec: 'parse-template-shape-table-columns' } },
    () => {
      const { shape } = parseTemplate(template);
      const rules = shape.sections.find((s) => s.key === 'rules');
      expect(rules?.body).toEqual({
        kind: 'table',
        minRows: 1,
        maxRows: 9,
        declared: true,
        columns: [
          { header: 'ID', kind: 'text', required: true, key: true, pattern: '^R[1-9][0-9]*$' },
          { header: 'Rule', kind: 'text', required: true, key: false },
          {
            header: 'Checked by',
            kind: 'enum',
            required: false,
            key: false,
            choices: ['spec', 'review'],
            defaultValue: 'review',
          },
        ],
      });
    },
  );

  it(
    'labeled-list, remove-if and repeated-groups shapes carry their constraints',
    { tags: ['invariant'], meta: { spec: 'parse-template-shape-fields-and-groups' } },
    () => {
      const { shape } = parseTemplate(template);
      const identity = shape.sections.find((s) => s.key === 'identity');
      expect(identity?.body).toEqual({
        kind: 'labeled-list',
        fields: [
          { label: 'Kind', required: true, choices: ['skill', 'product'] },
          { label: 'Version', required: false, pattern: '^\\d+\\.\\d+\\.\\d+$' },
        ],
      });
      const links = shape.sections.find((s) => s.key === 'links');
      expect(links?.removeIf).toEqual({ key: 'Kind', value: 'skill' });
      const changes = shape.sections.find((s) => s.key === 'changes');
      expect(changes?.body).toEqual({
        kind: 'repeated-groups',
        minGroups: 1,
        heading: { required: true, pattern: '^(add|fix): .+$' },
      });
    },
  );

  it(
    'the compiled schema is built from the shape: the parse result matches the shape keys',
    { tags: ['scenario'], meta: { spec: 'parse-template-shape-drives-the-compiled-schema' } },
    () => {
      const doc = `# Spec: all-kinds

> A summary of at least ten characters.

## Rules

| ID  | Rule    | Checked by |
| --- | ------- | ---------- |
| R1  | A rule. |            |

## Identity

- Kind: product
- Version: 1.2.3

## Changes

### add: a change

- one item
`;
      const data = parseTemplate(template).parse(doc);
      expect(data.title).toBe('Spec: all-kinds');
      expect(data.summary).toBe('A summary of at least ten characters.');
      expect(data.rules).toEqual([{ ID: 'R1', Rule: 'A rule.', 'Checked by': 'review' }]);
      expect(data.identity).toEqual({ Kind: 'product', Version: '1.2.3' });
      expect(data.changes).toEqual([{ heading: 'add: a change', items: ['one item'] }]);
    },
  );

  it(
    'a table without a row directive carries its header row as undeclared columns',
    { tags: ['invariant'], meta: { spec: 'parse-template-shape-undeclared-table-header' } },
    () => {
      const parsed = parseTemplate(
        '# T\n\n## Items\n\n| Name | Note |\n| --- | --- |\n| a | b |\n',
      );
      expect(parsed.shape.sections[0]?.body).toEqual({
        kind: 'table',
        declared: false,
        columns: [
          { header: 'Name', kind: 'text', required: false, key: false },
          { header: 'Note', kind: 'text', required: false, key: false },
        ],
      });
      expect(
        parsed.parse('# T\n\n## Items\n\n| Name | Other |\n| --- | --- |\n| x | y |\n').items,
      ).toEqual([{ Name: 'x', Other: 'y' }]);
    },
  );

  it(
    'the title shape carries the prefix, the separator and the directive beside the pattern',
    { tags: ['invariant'], meta: { spec: 'parse-template-shape-title-parts' } },
    () => {
      const titleOf = (h1: string): TitleShape | undefined =>
        parseTemplate(`${h1}\n\n## S\n\n<!-- TEMPLATE-ONLY: freetext -->\n`).shape.title;
      expect(
        titleOf('# CR-<!-- TEMPLATE-ONLY: string; regex `^\\d+$`; required -->'),
      ).toMatchObject({
        kind: 'field',
        prefix: 'CR-',
        separator: '',
        regex: '^\\d+$',
      });
      expect(titleOf('# Kind: <!-- TEMPLATE-ONLY: enum: A | B; required -->')).toMatchObject({
        kind: 'enum',
        prefix: 'Kind:',
        separator: ' ',
        choices: ['A', 'B'],
      });
      expect(titleOf('# Component: <!-- name -->')).toMatchObject({
        kind: 'pascal-case',
        prefix: 'Component:',
      });
      expect(titleOf('# Fixed title')).toMatchObject({ kind: 'literal', prefix: 'Fixed title' });
      expect(titleOf('# <!-- TEMPLATE-ONLY: string; required -->')).toEqual({});
    },
  );
});
