import { describe, it, expect } from 'vitest';
import { repeatedWhere } from './repeated-where.rules.ts';
import { freetext } from './freetext.rules.ts';
import { parseSection } from '../../testing/parse-section.fixture.ts';

describe('repeatedWhere', () => {
  it(
    'splits by thematic break and extracts each group',
    {
      tags: ['invariant'],
      meta: { spec: 'repeated-where-splits-by-thematic-break-and-extracts-each-group' },
    },
    () => {
      const md = '---\n\nFirst group.\n\n---\n\nSecond group.';
      const extractor = repeatedWhere({
        startsAt: (n) => n.type === 'thematicBreak',
        headingFrom: () => 'item',
        shape: { body: freetext },
      });
      const result = extractor(parseSection(md), { section: 'S' });
      expect(result).toHaveLength(2);
      expect(result[0]?.body).toBe('First group.');
      expect(result[1]?.body).toBe('Second group.');
    },
  );

  it(
    'includes boundary node when includeBoundary is true',
    {
      tags: ['invariant'],
      meta: { spec: 'repeated-where-includes-boundary-node-when-includeboundary-is-true' },
    },
    () => {
      const md = '---\n\nText.';
      const extractor = repeatedWhere({
        startsAt: (n) => n.type === 'thematicBreak',
        headingFrom: () => 'g',
        shape: { body: freetext },
        includeBoundary: true,
      });
      const result = extractor(parseSection(md), { section: 'S' });
      expect(result).toHaveLength(1);
    },
  );

  it(
    'returns empty array when no boundaries found',
    {
      tags: ['invariant'],
      meta: { spec: 'repeated-where-returns-empty-array-when-no-boundaries-found' },
    },
    () => {
      const md = 'Just plain text with no thematic breaks.';
      const extractor = repeatedWhere({
        startsAt: (n) => n.type === 'thematicBreak',
        headingFrom: () => 'x',
        shape: { body: freetext },
      });
      expect(extractor(parseSection(md), { section: 'S' })).toEqual([]);
    },
  );
});
