import { describe, it, expect } from 'vitest';
import { freetext } from './freetext.rules.ts';
import { parseSection } from '../../testing/parse-section.fixture.ts';

const ctx = { section: 'Test' };

describe('freetext extractor', () => {
  it(
    'round-trips a paragraph',
    { tags: ['invariant'], meta: { spec: 'freetext-round-trips-a-paragraph' } },
    () => {
      const nodes = parseSection('Hello world.');
      const result = freetext(nodes, ctx);
      expect(result).toBe('Hello world.');
    },
  );

  it(
    'round-trips paragraph + fenced code block',
    { tags: ['invariant'], meta: { spec: 'freetext-round-trips-paragraph-fenced-code-block' } },
    () => {
      const md = 'Intro.\n\n```ts\nconst x = 1;\n```';
      const nodes = parseSection(md);
      const result = freetext(nodes, ctx);
      expect(result).toContain('Intro.');
      expect(result).toContain('```ts');
      expect(result).toContain('const x = 1;');
    },
  );

  it(
    'round-trips a GFM table',
    { tags: ['invariant'], meta: { spec: 'freetext-round-trips-a-gfm-table' } },
    () => {
      const md = '| A | B |\n| --- | --- |\n| 1 | 2 |';
      const nodes = parseSection(md);
      const result = freetext(nodes, ctx);
      expect(result).toContain('| A |');
      expect(result).toContain('| 1 |');
    },
  );

  it(
    'round-trips a bullet list',
    { tags: ['invariant'], meta: { spec: 'freetext-round-trips-a-bullet-list' } },
    () => {
      const md = '- item one\n- item two';
      const nodes = parseSection(md);
      const result = freetext(nodes, ctx);
      expect(result).toContain('item one');
      expect(result).toContain('item two');
    },
  );

  it(
    'round-trips a blockquote',
    { tags: ['invariant'], meta: { spec: 'freetext-round-trips-a-blockquote' } },
    () => {
      const md = '> quoted text';
      const nodes = parseSection(md);
      const result = freetext(nodes, ctx);
      expect(result).toContain('> quoted text');
    },
  );

  it(
    'round-trips a thematic break',
    { tags: ['invariant'], meta: { spec: 'freetext-round-trips-a-thematic-break' } },
    () => {
      const md = 'Before.\n\n---\n\nAfter.';
      const nodes = parseSection(md);
      const result = freetext(nodes, ctx);
      // toMarkdown normalizes --- to *** (its default thematic break form)
      expect(result).toMatch(/^[*-]{3,}$/m);
      expect(result).toContain('Before.');
      expect(result).toContain('After.');
    },
  );

  it(
    'round-trips H3+ headings',
    { tags: ['invariant'], meta: { spec: 'freetext-round-trips-h3-headings' } },
    () => {
      const md = '### Sub-heading\n\nSome text.';
      const nodes = parseSection(md);
      const result = freetext(nodes, ctx);
      expect(result).toContain('### Sub-heading');
      expect(result).toContain('Some text.');
    },
  );

  it(
    'throws when a top-level guide directive is in the body',
    {
      tags: ['invariant'],
      meta: { spec: 'freetext-throws-when-a-top-level-guide-directive-is-in-the-body' },
    },
    () => {
      const nodes = parseSection('Some prose.\n<!-- TEMPLATE-ONLY: guide\n// stray guide\n-->');
      expect(() => freetext(nodes, ctx)).toThrow(
        'free-text bodies cannot contain TEMPLATE-ONLY directives',
      );
    },
  );

  it(
    'throws when an inline directive is nested inside a paragraph',
    {
      tags: ['invariant'],
      meta: { spec: 'freetext-throws-when-an-inline-directive-is-nested-inside-a-paragraph' },
    },
    () => {
      const nodes = parseSection('Value: <!-- TEMPLATE-ONLY: string; required -->');
      expect(() => freetext(nodes, ctx)).toThrow(
        'free-text bodies cannot contain TEMPLATE-ONLY directives',
      );
    },
  );
});
