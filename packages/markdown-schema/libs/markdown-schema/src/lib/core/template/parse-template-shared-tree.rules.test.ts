import { unified } from 'unified';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { describe, expect, it } from 'vitest';
import { parseTemplate, parseTemplateAsync } from './parse-template.rules.ts';

const TEMPLATE = `# Note

## Summary

<!-- TEMPLATE-ONLY: freetext -->

text
`;

const REGEX_TEMPLATE = `# Note

## Rows

| Id | Name |
| -- | ---- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Id: string; regex \`^N-\\d+$\`; required; key
Name: string; required
-->

| N-1 | one |
`;

describe('parse with a shared tree', () => {
  it(
    'gives the same data as parsing the text, and the same error for a document that does not conform',
    {
      tags: ['invariant'],
      meta: { spec: 'parse-with-tree-equals-parse-with-text' },
    },
    () => {
      const template = parseTemplate(TEMPLATE);
      const tree = (raw: string): ReturnType<ReturnType<typeof unified>['parse']> =>
        unified().use(remarkParse).use(remarkFrontmatter, ['yaml']).use(remarkGfm).parse(raw);
      const good = '# Note\n\n## Summary\n\nhello\n';
      expect(template.parse(good, { tree: tree(good) as never })).toEqual(template.parse(good));
      const bad = '# Note\n\n## Other\n\nhello\n';
      const messageOf = (run: () => unknown): string => {
        try {
          run();
        } catch (error) {
          return (error as Error).message;
        }
        return '';
      };
      const fromText = messageOf(() => template.parse(bad));
      expect(fromText).toContain('Unrecognized section');
      expect(messageOf(() => template.parse(bad, { tree: tree(bad) as never }))).toBe(fromText);
    },
  );
});

describe('parseTemplateAsync', () => {
  it(
    'compiles to a template that parses like the synchronous one',
    {
      tags: ['scenario'],
      meta: {
        spec: 'parse-template-async-matches-sync',
        arrange: 'a template with a regex column',
        act: 'it is compiled with the asynchronous entry and a document is parsed',
        assert: 'the data and the key columns equal the synchronous template’s',
      },
    },
    async () => {
      let sync: ReturnType<typeof parseTemplate>;
      let async: Awaited<ReturnType<typeof parseTemplateAsync>>;
      arrange: {
        sync = parseTemplate(REGEX_TEMPLATE);
      }
      act: {
        async = await parseTemplateAsync(REGEX_TEMPLATE);
      }
      assert: {
        const doc = '# Note\n\n## Rows\n\n| Id | Name |\n| -- | ---- |\n| N-7 | seven |\n';
        expect(async.parse(doc)).toEqual(sync.parse(doc));
        expect(async.keyColumns).toEqual(sync.keyColumns);
      }
    },
  );

  it(
    'rejects an unsafe pattern with the message the synchronous entry gives',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'parse-template-async-rejects-unsafe-regex',
        arrange: 'a template whose regex backtracks catastrophically',
        act: 'it is compiled with each entry',
        assert: 'both fail with the same message',
      },
    },
    async () => {
      const unsafe = REGEX_TEMPLATE.replace('^N-\\d+$', '^(a+)+$');
      let syncMessage = '';
      let asyncMessage = '';
      arrange: {
        try {
          parseTemplate(unsafe);
        } catch (error) {
          syncMessage = (error as Error).message;
        }
      }
      act: {
        await parseTemplateAsync(unsafe).catch((error: unknown) => {
          asyncMessage = (error as Error).message;
        });
      }
      assert: {
        expect(syncMessage).toContain('catastrophic backtracking');
        expect(asyncMessage).toBe(syncMessage);
      }
    },
  );
});
