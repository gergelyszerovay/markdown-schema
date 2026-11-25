import { describe, expect, it } from 'vitest';
import type { DirectoryEntry } from './directory-entry.model.ts';
import { listFilePaths } from './list-file-paths.rules.ts';

const skill = 'skills/x/markdown-schema-templates/note';
const entries: DirectoryEntry[] = [
  { path: '.', kind: 'directory' },
  { path: 'a.md', kind: 'file' },
  { path: skill, kind: 'directory' },
  { path: `${skill}/note.template.md`, kind: 'file' },
  { path: `${skill}/note.refine.ts`, kind: 'file' },
  { path: `${skill}/examples/valid.md`, kind: 'file' },
  { path: 'app/markdown-schema-templates/note', kind: 'symlink', target: skill },
  { path: 'app/markdown-schema-templates/gone', kind: 'symlink' },
  { path: 'app/link.md', kind: 'symlink', target: 'a.md' },
];

describe('listFilePaths', () => {
  it(
    'lists the files, and shows a linked template’s template and refine files under the link, nothing else',
    { tags: ['invariant'], meta: { spec: 'list-file-paths-links-stand-for-templates' } },
    () => {
      const paths = listFilePaths(entries);

      expect(paths).toEqual([
        'a.md',
        `${skill}/note.template.md`,
        `${skill}/note.refine.ts`,
        `${skill}/examples/valid.md`,
        'app/markdown-schema-templates/note/note.template.md',
        'app/markdown-schema-templates/note/note.refine.ts',
      ]);
    },
  );

  it(
    'ignores a link outside a templates folder, one that points nowhere and one whose target lacks the template',
    { tags: ['edge-case'], meta: { spec: 'list-file-paths-ignores-other-links' } },
    () => {
      const paths = listFilePaths([
        { path: 'x', kind: 'directory' },
        { path: 'lib/other', kind: 'symlink', target: 'x' },
        { path: 'markdown-schema-templates/none', kind: 'symlink' },
        { path: 'markdown-schema-templates/empty', kind: 'symlink', target: 'x' },
      ]);

      expect(paths).toEqual([]);
    },
  );
});
