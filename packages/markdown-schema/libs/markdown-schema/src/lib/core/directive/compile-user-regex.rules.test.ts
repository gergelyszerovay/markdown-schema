import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { compileUserRegex } from './compile-user-regex.rules.ts';
import { DirectiveError } from './directive.error.ts';

describe('compileUserRegex', () => {
  it('compiles a safe pattern, again from the memoized verdict', () => {
    assert.ok(compileUserRegex('^[a-z]+-\\d+$', 'id').test('abc-12'));
    assert.ok(compileUserRegex('^[a-z]+-\\d+$', 'other').test('abc-12'));
  });

  it('refuses a catastrophic pattern every time, naming the label of each call', () => {
    assert.throws(
      () => compileUserRegex('^(a+)+$', 'first'),
      (error: unknown) => {
        return error instanceof DirectiveError && error.message.includes('for first');
      },
    );
    assert.throws(
      () => compileUserRegex('^(a+)+$', 'second'),
      (error: unknown) => {
        return error instanceof DirectiveError && error.message.includes('for second');
      },
    );
  });
});
