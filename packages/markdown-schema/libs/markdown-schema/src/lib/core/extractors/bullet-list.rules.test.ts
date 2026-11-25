import { describe, it, expect } from 'vitest';
import { bulletList } from './bullet-list.rules.ts';
import { parseSection } from '../../testing/parse-section.fixture.ts';

describe('bulletList', () => {
  it(
    'extracts list items as strings',
    { tags: ['invariant'], meta: { spec: 'bullet-list-extracts-list-items-as-strings' } },
    () => {
      const nodes = parseSection('- Alpha\n- Beta\n- Gamma');
      expect(bulletList(nodes, { section: 'S' })).toEqual(['Alpha', 'Beta', 'Gamma']);
    },
  );

  it(
    'yields the url for link items and the value for legacy inline-code items',
    {
      tags: ['invariant'],
      meta: {
        spec: 'bullet-list-yields-the-url-for-link-items-and-the-value-for-legacy-inline-code',
      },
    },
    () => {
      const nodes = parseSection(
        '- [4.foo.feature.md](../3.features/4.foo.feature.md)\n- `@pkg#Sym`',
      );
      expect(bulletList(nodes, { section: 'S' })).toEqual([
        '../3.features/4.foo.feature.md',
        '@pkg#Sym',
      ]);
    },
  );

  it(
    'throws when no list is present',
    { tags: ['invariant'], meta: { spec: 'bullet-list-throws-when-no-list-is-present' } },
    () => {
      const nodes = parseSection('No list here.');
      expect(() => bulletList(nodes, { section: 'Items' })).toThrow(
        `Section "Items" must contain a list`,
      );
    },
  );
});
