import { describe, it } from 'vitest';

describe('buildLabeledListSchema', () => {
  it.todo('validates each declared label, fills defaults, and rejects an undeclared key', {
    tags: ['invariant'],
    meta: { spec: 'build-labeled-list-schema-validates-declared-labels' },
  });
  it.todo('rejects an item directive that is neither an inline field nor an enum', {
    tags: ['invariant'],
    meta: { spec: 'build-labeled-list-schema-rejects-other-directive-kinds' },
  });
});
