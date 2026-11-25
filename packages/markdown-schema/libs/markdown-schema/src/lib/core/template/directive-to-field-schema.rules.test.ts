import { describe, it } from 'vitest';

describe('directiveToFieldSchema', () => {
  it.todo('a required field or enum rejects a missing value and an optional one accepts it', {
    tags: ['invariant'],
    meta: { spec: 'directive-to-field-schema-required-versus-optional' },
  });
  it.todo('an enum accepts only its listed choices', {
    tags: ['invariant'],
    meta: { spec: 'directive-to-field-schema-enum-accepts-only-its-choices' },
  });
});
