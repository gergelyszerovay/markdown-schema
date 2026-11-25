import { describe, expect, it } from 'vitest';
import type { ValidateDocumentsResult } from '../core/validate-documents/validate-documents.result.ts';
import { formatValidateDocumentsResult } from './validate-documents-result.format.ts';

describe('formatValidateDocumentsResult', () => {
  it.each<{ result: ValidateDocumentsResult; lines: string[] }>([
    {
      result: { kind: 'template-unreadable', message: 'ENOENT: gone' },
      lines: ['Error: cannot read template: ENOENT: gone'],
    },
    {
      result: { kind: 'template-invalid', templatePath: 't.template.md', message: 'bad directive' },
      lines: ['Error: invalid template t.template.md: bad directive'],
    },
    {
      result: {
        kind: 'validated',
        documents: [
          { kind: 'valid', path: 'a.md', wrote: undefined },
          { kind: 'valid', path: 'b.md', wrote: 'out.json' },
          { kind: 'failed', path: 'c.md', message: 'Missing required section: "1. Meta"' },
          {
            kind: 'schema-invalid',
            path: 'd.md',
            issues: [
              { path: 'meta.Name', message: 'Name must not be BAD' },
              { path: '(root)', message: 'Invalid input' },
            ],
          },
        ],
      },
      lines: [
        'a.md: OK',
        'b.md: OK (wrote out.json)',
        'c.md: Missing required section: "1. Meta"',
        'd.md: schema validation failed',
        '  - meta.Name: Name must not be BAD',
        '  - (root): Invalid input',
      ],
    },
  ])(
    'prints one line per fact, in the layout markdown-schema 0.3.0 used ($result.kind)',
    { tags: ['invariant'], meta: { spec: 'validate-documents-result-format-lines' } },
    ({ result, lines }) => {
      expect(formatValidateDocumentsResult(result)).toEqual(lines);
    },
  );
});
