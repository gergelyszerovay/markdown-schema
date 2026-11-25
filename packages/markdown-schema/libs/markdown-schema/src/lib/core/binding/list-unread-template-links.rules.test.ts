import { describe, expect, it } from 'vitest';
import { listUnreadTemplateLinks } from './list-unread-template-links.rules.ts';

describe('listUnreadTemplateLinks', () => {
  it(
    'names a template link whose target holds no template it could read, and nothing else',
    { tags: ['invariant'], meta: { spec: 'unread-template-links-named' } },
    () => {
      const unread = listUnreadTemplateLinks([
        { path: '.', kind: 'directory' },
        { path: 'skills/x/markdown-schema-templates/note/note.template.md', kind: 'file' },
        { path: '.claude/skills/x', kind: 'symlink', target: 'skills/x' },
        {
          path: 'markdown-schema-templates/note',
          kind: 'symlink',
          target: 'skills/x/markdown-schema-templates/note',
        },
        {
          path: 'markdown-schema-templates/linked',
          kind: 'symlink',
          target: '.claude/skills/x/markdown-schema-templates/linked',
        },
        { path: 'layered-doc-templates/gone', kind: 'symlink', target: 'nowhere/gone' },
        { path: 'markdown-schema-templates/outside', kind: 'symlink' },
        { path: 'lib/other', kind: 'symlink', target: 'skills/x' },
      ]);

      expect(unread).toEqual([
        {
          path: 'markdown-schema-templates/linked',
          name: 'linked',
          target: '.claude/skills/x/markdown-schema-templates/linked',
        },
        { path: 'layered-doc-templates/gone', name: 'gone', target: 'nowhere/gone' },
      ]);
    },
  );
});
