import { describe, expect, it } from 'vitest';
import { parseSection } from '../../testing/parse-section.fixture.ts';
import { blockHtmlNodes } from './block-html-nodes.rules.ts';

describe('blockHtmlNodes', () => {
  it(
    'keeps only the html nodes, in order',
    { tags: ['invariant'], meta: { spec: 'block-html-nodes-keeps-only-html' } },
    () => {
      const nodes = parseSection('Text.\n\n<!-- one -->\n\n- item\n\n<!-- two -->');
      expect(blockHtmlNodes(nodes).map((node) => node.value)).toEqual([
        '<!-- one -->',
        '<!-- two -->',
      ]);
    },
  );

  it(
    'returns an empty array when there is no html node',
    { tags: ['invariant'], meta: { spec: 'block-html-nodes-empty-without-html' } },
    () => {
      expect(blockHtmlNodes(parseSection('Just text.'))).toEqual([]);
    },
  );
});
