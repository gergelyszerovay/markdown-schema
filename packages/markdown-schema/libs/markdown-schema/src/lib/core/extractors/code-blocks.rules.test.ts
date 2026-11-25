import { describe, it, expect } from 'vitest';
import { codeBlocks } from './code-blocks.rules.ts';
import { parseSection } from '../../testing/parse-section.fixture.ts';

describe('codeBlocks', () => {
  it(
    'collects all fenced code blocks with language and value',
    {
      tags: ['invariant'],
      meta: { spec: 'code-blocks-collects-all-fenced-code-blocks-with-language-and-value' },
    },
    () => {
      const md = '```ts\nconst x = 1;\n```\n\n```js\nconsole.log();\n```';
      const blocks = codeBlocks(parseSection(md), { section: 'S' });
      expect(blocks).toEqual([
        { lang: 'ts', value: 'const x = 1;' },
        { lang: 'js', value: 'console.log();' },
      ]);
    },
  );

  it(
    'yields null lang for unlabeled blocks',
    { tags: ['invariant'], meta: { spec: 'code-blocks-yields-null-lang-for-unlabeled-blocks' } },
    () => {
      const nodes = parseSection('```\nplain\n```');
      expect(codeBlocks(nodes, { section: 'S' })).toEqual([{ lang: null, value: 'plain' }]);
    },
  );

  it(
    'returns empty array when no code blocks',
    { tags: ['invariant'], meta: { spec: 'code-blocks-returns-empty-array-when-no-code-blocks' } },
    () => {
      const nodes = parseSection('Just text.');
      expect(codeBlocks(nodes, { section: 'S' })).toEqual([]);
    },
  );
});
