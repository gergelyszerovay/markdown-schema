import { describe, expect, it } from 'vitest';
import { DirectiveError } from './directive.error.ts';
import { parseDirective } from './parse-directive.rules.ts';
import { parseDocumentDirective } from './parse-document-directive.rules.ts';

describe('parseDocumentDirective', () => {
  it(
    'reads open and unordered from the opener line',
    { tags: ['invariant'], meta: { spec: 'parse-document-directive-reads-both-modifiers' } },
    () => {
      expect(parseDocumentDirective('document; open; unordered')).toEqual({
        kind: 'document',
        open: true,
        unordered: true,
      });
      expect(parseDocumentDirective('document; unordered')).toEqual({
        kind: 'document',
        open: false,
        unordered: true,
      });
      expect(parseDocumentDirective('document')).toEqual({
        kind: 'document',
        open: false,
        unordered: false,
      });
    },
  );

  it(
    'rejects an unknown modifier and a modifier in the body',
    { tags: ['invariant'], meta: { spec: 'parse-document-directive-rejects-unknown-input' } },
    () => {
      expect(() => parseDocumentDirective('document; closed')).toThrow(DirectiveError);
      expect(() => parseDocumentDirective('document\nopen')).toThrow(/on the directive opener/);
    },
  );

  it(
    'is reached through parseDirective',
    { tags: ['invariant'], meta: { spec: 'parse-directive-dispatches-document' } },
    () => {
      expect(parseDirective('document; open')).toMatchObject({ kind: 'document', open: true });
    },
  );
});
