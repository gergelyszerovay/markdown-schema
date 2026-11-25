import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type { RootContent } from 'mdast';
import { cellText } from './cell-text.rules.ts';

/**
 * Parses an inline snippet.
 * @param md - The Markdown snippet.
 * @returns The first node of the parsed tree, which holds the snippet.
 */
function inline(md: string): RootContent {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(md);
  const node = tree.children[0];
  if (node === undefined) throw new Error(`no node parsed from ${md}`);
  return node;
}

describe('cellText', () => {
  it(
    'stringifies a link to its url, not its label',
    {
      tags: ['invariant'],
      meta: { spec: 'cell-text-stringifies-a-link-to-its-url-not-its-label' },
    },
    () => {
      expect(
        cellText(
          inline('[3.location.s1-data-type.md](../2.data-types/3.location.s1-data-type.md)'),
        ),
      ).toBe('../2.data-types/3.location.s1-data-type.md');
    },
  );

  it(
    'uses the url even when the label carries nested emphasis',
    {
      tags: ['invariant'],
      meta: { spec: 'cell-text-uses-the-url-even-when-the-label-carries-nested-emphasis' },
    },
    () => {
      expect(cellText(inline('[*emphasised label*](./a.md)'))).toBe('./a.md');
    },
  );

  it(
    'leaves legacy inline-code citations unchanged',
    {
      tags: ['invariant'],
      meta: { spec: 'cell-text-leaves-legacy-inline-code-citations-unchanged' },
    },
    () => {
      expect(cellText(inline('`@pkg#Symbol`'))).toBe('@pkg#Symbol');
    },
  );

  it(
    'stringifies a repo-root absolute link to its url',
    {
      tags: ['invariant'],
      meta: { spec: 'cell-text-stringifies-a-repo-root-absolute-link-to-its-url' },
    },
    () => {
      expect(
        cellText(
          inline('[2.fractal-tree.spec.md](/layered-docs/1.architecture/2.fractal-tree.spec.md)'),
        ),
      ).toBe('/layered-docs/1.architecture/2.fractal-tree.spec.md');
    },
  );

  it(
    'concatenates mixed text, link (url) and inline code',
    {
      tags: ['invariant'],
      meta: { spec: 'cell-text-concatenates-mixed-text-link-url-and-inline-code' },
    },
    () => {
      expect(cellText(inline('see [x](./a.md) and `@pkg#Sym`'))).toBe('see ./a.md and @pkg#Sym');
    },
  );

  it(
    'preserves an autolink (url equals label)',
    { tags: ['invariant'], meta: { spec: 'cell-text-preserves-an-autolink-url-equals-label' } },
    () => {
      expect(cellText(inline('<https://example.com>'))).toBe('https://example.com');
    },
  );

  it(
    'falls back to image alt',
    { tags: ['invariant'], meta: { spec: 'cell-text-falls-back-to-image-alt' } },
    () => {
      expect(cellText(inline('![alt text](./img.png)'))).toBe('alt text');
    },
  );

  it(
    'returns empty string for a non-node value',
    { tags: ['invariant'], meta: { spec: 'cell-text-returns-empty-string-for-a-non-node-value' } },
    () => {
      expect(cellText(null)).toBe('');
      expect(cellText(undefined)).toBe('');
    },
  );
});
