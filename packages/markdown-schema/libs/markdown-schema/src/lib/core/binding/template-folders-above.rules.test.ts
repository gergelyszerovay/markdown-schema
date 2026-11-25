import { describe, expect, it } from 'vitest';
import { templateFoldersAbove } from './template-folders-above.rules.ts';

describe('templateFoldersAbove', () => {
  it(
    'names the templates folder of each proper ancestor, the root first, each folder once',
    { tags: ['invariant'], meta: { spec: 'template-folders-above-names-ancestor-folders' } },
    () => {
      expect(templateFoldersAbove(['a/b', 'a/c/d.md'])).toEqual([
        'markdown-schema-templates',
        'layered-doc-templates',
        'a/markdown-schema-templates',
        'a/layered-doc-templates',
        'a/c/markdown-schema-templates',
        'a/c/layered-doc-templates',
      ]);
    },
  );

  it(
    'has nothing above the root',
    { tags: ['edge-case'], meta: { spec: 'template-folders-above-root-has-none' } },
    () => {
      expect(templateFoldersAbove(['.'])).toEqual([]);
      expect(templateFoldersAbove([])).toEqual([]);
    },
  );

  it(
    'lists the root’s folder for a top-level path',
    { tags: ['edge-case'], meta: { spec: 'template-folders-above-top-level-path' } },
    () => {
      expect(templateFoldersAbove(['README.md'])).toEqual([
        'markdown-schema-templates',
        'layered-doc-templates',
      ]);
    },
  );
});
