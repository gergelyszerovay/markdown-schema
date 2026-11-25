import { describe, expect, it } from 'vitest';
import type { ValidateTreeResult } from '../core/validate-tree/validate-tree.result.ts';
import { formatValidateTreeResult } from './validate-tree-result.format.ts';

const result: ValidateTreeResult = {
  kind: 'validated',
  root: '/repo',
  documents: [
    {
      path: 'a.md',
      templatePath: 't.template.md',
      outcome: { kind: 'valid', path: 'a.md', wrote: undefined },
    },
    {
      path: 'b.md',
      templatePath: 't.template.md',
      outcome: {
        kind: 'schema-invalid',
        path: 'b.md',
        issues: [{ path: 'meta.Name', message: 'Required' }],
      },
    },
    {
      path: 'c.md',
      templatePath: 'u.template.md',
      outcome: { kind: 'not-validated', path: 'c.md', message: 'its template did not compile' },
    },
  ],
  ambiguous: [{ path: 'd.md', candidates: ['p/x.template.md', 'q/x.template.md'] }],
  unbound: ['e.md'],
  templateErrors: [{ templatePath: 'u.template.md', message: 'bad directive' }],
  unreadTemplateLinks: [],
  summary: { documents: 3, ok: 1, failed: 2, ambiguous: 1, unbound: 1, templateErrors: 1 },
};

describe('formatValidateTreeResult', () => {
  it(
    'prints template errors, a line per document as single-template mode does, ambiguous files and the summary',
    {
      tags: ['invariant'],
      meta: { spec: 'validate-tree-format-lines-and-summary' },
    },
    () => {
      expect(formatValidateTreeResult(result, { verbose: false })).toEqual([
        'Error: invalid template u.template.md: bad directive',
        'a.md: OK',
        'b.md: schema validation failed',
        '  - meta.Name: Required',
        'c.md: its template did not compile',
        'd.md: ambiguous template: p/x.template.md, q/x.template.md',
        '3 documents: 1 OK, 2 failed; 1 ambiguous; 1 unbound; 1 template error',
      ]);
    },
  );

  it(
    'lists the unbound files only when verbose',
    { tags: ['invariant'], meta: { spec: 'validate-tree-format-verbose-lists-unbound' } },
    () => {
      expect(formatValidateTreeResult(result, { verbose: true })).toContain('e.md: unbound');
      expect(formatValidateTreeResult(result, { verbose: false })).not.toContain('e.md: unbound');
    },
  );

  it(
    'warns of a template link that stands for no template, without failing the summary',
    { tags: ['invariant'], meta: { spec: 'validate-tree-format-unread-template-link' } },
    () => {
      const lines = formatValidateTreeResult(
        {
          ...result,
          unreadTemplateLinks: [
            {
              path: 'markdown-schema-templates/note',
              name: 'note',
              target: '.claude/skills/x/markdown-schema-templates/note',
            },
          ],
        },
        { verbose: false },
      );
      expect(lines).toContain(
        'Warning: template link markdown-schema-templates/note -> .claude/skills/x/markdown-schema-templates/note: no note.template.md could be read there (it is missing, or the way there crosses a symbolic link or a skipped folder such as node_modules); no document is bound to it',
      );
      expect(lines.at(-1)).toBe(
        '3 documents: 1 OK, 2 failed; 1 ambiguous; 1 unbound; 1 template error',
      );
    },
  );
});
