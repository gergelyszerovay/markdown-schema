import { describe, expect, it } from 'vitest';
import type { Root } from 'mdast';
import remarkFrontmatter from 'remark-frontmatter';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { extractFrontmatter } from './extract-frontmatter.rules.ts';

const parse = (md: string): Root =>
  unified().use(remarkParse).use(remarkFrontmatter, ['yaml']).parse(md);

describe('extractFrontmatter', () => {
  it.each([
    {
      md: '---\nname: Heritage\ntags:\n  - a\n---\n# T',
      expected: { name: 'Heritage', tags: ['a'] },
    },
    { md: '---\n---\n# T', expected: {} },
    { md: '# T\n\nNo frontmatter.', expected: undefined },
  ])(
    'parses the YAML block, normalises an empty block to {}, and yields undefined without one',
    { tags: ['invariant'], meta: { spec: 'extract-frontmatter-parses-the-yaml-block' } },
    ({ md, expected }) => {
      expect(extractFrontmatter(parse(md))).toEqual(expected);
    },
  );
});
