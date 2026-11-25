import { describe, it } from 'vitest';

describe('splitDoc', () => {
  it.todo('splits a tree into the title, the frontmatter and one node list per section heading', {
    tags: ['invariant'],
    meta: { spec: 'split-doc-splits-title-frontmatter-and-sections' },
  });
  it.todo('rejects two sections with the same heading text', {
    tags: ['invariant'],
    meta: { spec: 'split-doc-duplicate-heading-throws' },
  });
});
