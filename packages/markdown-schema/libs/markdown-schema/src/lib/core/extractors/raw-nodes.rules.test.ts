import { describe, expect, it } from 'vitest';
import { parseSection } from '../../testing/parse-section.fixture.ts';
import { rawNodes } from './raw-nodes.rules.ts';

describe('rawNodes', () => {
  it.each(['Just text.', '- a\n- b', '### Sub\n\n| A |\n| - |\n| 1 |', ''])(
    'passes the section nodes through as the same array (%j)',
    { tags: ['invariant'], meta: { spec: 'raw-nodes-returns-the-same-array' } },
    (md) => {
      const nodes = parseSection(md);
      expect(rawNodes(nodes, { section: 'S' })).toBe(nodes);
    },
  );
});
