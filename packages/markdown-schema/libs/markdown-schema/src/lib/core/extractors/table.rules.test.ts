import { describe, it, expect } from 'vitest';
import { table } from './table.rules.ts';
import { parseSection } from '../../testing/parse-section.fixture.ts';

describe('table', () => {
  it(
    'parses header and body rows into objects',
    { tags: ['invariant'], meta: { spec: 'table-parses-header-and-body-rows-into-objects' } },
    () => {
      const md = `| Name | Age |\n|------|-----|\n| Alice | 30 |\n| Bob | 25 |`;
      const rows = table(parseSection(md), { section: 'S' });
      expect(rows).toEqual([
        { Name: 'Alice', Age: '30' },
        { Name: 'Bob', Age: '25' },
      ]);
    },
  );

  it(
    'yields the url for a body-cell link but the label for a header-cell link',
    {
      tags: ['invariant'],
      meta: { spec: 'table-yields-the-url-for-a-body-cell-link-but-the-label-for-a-header-cell' },
    },
    () => {
      const md = [
        '| Symbol | [Spec](./header-link.md) |',
        '|--------|------|',
        '| `@pkg#Foo` | [4.foo.feature.md](../3.features/4.foo.feature.md) |',
      ].join('\n');
      const rows = table(parseSection(md), { section: 'S' });
      // Header link flattens to its label (header text is never a citation).
      expect(Object.keys(rows[0] ?? {})).toEqual(['Symbol', 'Spec']);
      // Body link cell yields the url; inline-code cell is unchanged.
      expect(rows[0]).toEqual({
        Symbol: '@pkg#Foo',
        Spec: '../3.features/4.foo.feature.md',
      });
    },
  );

  it(
    'throws when no table is present',
    { tags: ['invariant'], meta: { spec: 'table-throws-when-no-table-is-present' } },
    () => {
      const nodes = parseSection('Just some text.');
      expect(() => table(nodes, { section: 'My Section' })).toThrow(
        `Section "My Section" must contain a table`,
      );
    },
  );
});
