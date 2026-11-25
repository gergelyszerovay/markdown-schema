import { describe, it } from 'vitest';

describe('inferTitleShape', () => {
  it.todo(
    'shapes the title pattern by the H1 directive: regex field, free field, enum or PascalCase default',
    { tags: ['invariant'], meta: { spec: 'infer-title-shape-pattern-follows-the-directive' } },
  );
  it.todo('pins the literal title text when the H1 has no placeholder', {
    tags: ['invariant'],
    meta: { spec: 'infer-title-shape-literal-title' },
  });
});
