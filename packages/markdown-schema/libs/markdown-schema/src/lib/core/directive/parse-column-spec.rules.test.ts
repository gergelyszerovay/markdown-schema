import { describe, expect, it } from 'vitest';
import { parseColumnSpec } from './parse-column-spec.rules.ts';

describe('parseColumnSpec', () => {
  it.todo('reads required, optional, regex, enum and default modifiers of a column', {
    tags: ['invariant'],
    meta: { spec: 'parse-column-spec-reads-every-modifier' },
  });
  it.todo('rejects a column that is both required and carries a default', {
    tags: ['invariant'],
    meta: { spec: 'parse-column-spec-required-with-default-is-contradictory' },
  });

  it(
    'reads key as a required column that identifies rows',
    { tags: ['invariant'], meta: { spec: 'parse-column-spec-reads-key' } },
    () => {
      expect(parseColumnSpec('string; key')).toMatchObject({ key: true, required: true });
      expect(parseColumnSpec('string; required')).toMatchObject({ key: false });
    },
  );

  it(
    'rejects a key column that is optional or carries a default',
    { tags: ['invariant'], meta: { spec: 'parse-column-spec-key-is-required' } },
    () => {
      expect(() => parseColumnSpec('string; key; optional')).toThrow(/'key' and 'optional'/);
      expect(() => parseColumnSpec('string; key; default=x')).toThrow(/'key' and carry/);
    },
  );
});

describe('parseColumnSpec: checkbox', () => {
  it(
    'checkbox yields a required checkbox column',
    { tags: ['invariant'], meta: { spec: 'parse-column-spec-checkbox' } },
    () => {
      expect(parseColumnSpec('checkbox')).toEqual({ required: true, key: false, checkbox: true });
      expect(parseColumnSpec('checkbox; required').checkbox).toBe(true);
    },
  );
});
