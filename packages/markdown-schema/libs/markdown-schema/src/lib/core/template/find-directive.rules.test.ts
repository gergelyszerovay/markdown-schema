import { describe, expect, it } from 'vitest';
import type { ParsedDirective } from '../directive/parsed-directive.model.ts';
import { findDirective } from './find-directive.rules.ts';

const directives: ParsedDirective[] = [
  { kind: 'guide' },
  { kind: 'section', optional: true },
  { kind: 'section', optional: false },
];

describe('findDirective', () => {
  it(
    'returns the first directive of the requested kind',
    { tags: ['invariant'], meta: { spec: 'find-directive-returns-the-first-of-a-kind' } },
    () => {
      expect(findDirective(directives, 'section')).toBe(directives[1]);
      expect(findDirective(directives, 'guide')).toBe(directives[0]);
    },
  );

  it(
    'returns undefined when no directive has the kind',
    { tags: ['invariant'], meta: { spec: 'find-directive-returns-undefined-without-a-match' } },
    () => {
      expect(findDirective(directives, 'row')).toBeUndefined();
      expect(findDirective([], 'guide')).toBeUndefined();
    },
  );
});
