import { describe, it } from 'vitest';

describe('readDocumentDirective', () => {
  it.todo('reads the document directive between the title and the first section', {
    tags: ['invariant'],
    meta: { spec: 'read-document-directive-reads-the-preamble-directive' },
  });
  it.todo('ignores guide directives and returns both options false without a directive', {
    tags: ['edge-case'],
    meta: { spec: 'read-document-directive-defaults-to-closed-and-ordered' },
  });
});
