import { describe, it } from 'vitest';

describe('splitSections', () => {
  it.todo('groups the tree into one node list per H2 heading, in order, skipping the H1', {
    tags: ['invariant'],
    meta: { spec: 'split-sections-groups-nodes-by-h2-heading' },
  });
  it.todo('rejects an inline directive in an H2 heading and a duplicate H2 heading', {
    tags: ['invariant'],
    meta: { spec: 'split-sections-rejects-h2-directives-and-duplicates' },
  });
});
