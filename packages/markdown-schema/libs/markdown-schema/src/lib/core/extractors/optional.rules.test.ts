import { describe, it, expect } from 'vitest';
import { optional } from './optional.rules.ts';
import { table } from './table.rules.ts';
import { parseSection } from '../../testing/parse-section.fixture.ts';

describe('optional', () => {
  it(
    'returns value when extractor succeeds',
    { tags: ['invariant'], meta: { spec: 'optional-returns-value-when-extractor-succeeds' } },
    () => {
      const md = '| A | B |\n|---|---|\n| 1 | 2 |';
      const result = optional(table)(parseSection(md), { section: 'S' });
      expect(result).toEqual([{ A: '1', B: '2' }]);
    },
  );

  it(
    'returns undefined when extractor throws',
    { tags: ['invariant'], meta: { spec: 'optional-returns-undefined-when-extractor-throws' } },
    () => {
      const nodes = parseSection('No table here.');
      const result = optional(table)(nodes, { section: 'S' });
      expect(result).toBeUndefined();
    },
  );
});
