import { describe, it } from 'vitest';

describe('collectItemDirectives', () => {
  it.todo('names an item by the text before the first colon of its first paragraph', {
    tags: ['invariant'],
    meta: { spec: 'collect-item-directives-labels-an-item-by-its-text-before-the-colon' },
  });
  it.todo('maps an item without a directive to null', {
    tags: ['invariant'],
    meta: { spec: 'collect-item-directives-item-without-directive-is-null' },
  });
  it.todo('skips an item whose first paragraph has no colon label', {
    tags: ['invariant'],
    meta: { spec: 'collect-item-directives-skips-an-unlabeled-item' },
  });
});
