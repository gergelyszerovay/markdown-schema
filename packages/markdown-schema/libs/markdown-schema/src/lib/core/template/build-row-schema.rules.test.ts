import { describe, it } from 'vitest';

describe('buildRowSchema', () => {
  it.todo('a required string column rejects an empty cell and an undeclared column is rejected', {
    tags: ['invariant'],
    meta: { spec: 'build-row-schema-required-and-strict-columns' },
  });
  it.todo('a column with a default fills an empty or absent cell with the default', {
    tags: ['invariant'],
    meta: { spec: 'build-row-schema-default-fills-an-empty-cell' },
  });
});
