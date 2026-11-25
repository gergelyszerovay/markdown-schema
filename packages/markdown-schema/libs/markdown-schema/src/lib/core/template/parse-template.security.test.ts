import { describe, it, expect } from 'vitest';
import { compileUserRegex } from '../directive/compile-user-regex.rules.ts';
import { DirectiveError } from '../directive/directive.error.ts';
import { parseTemplate } from './parse-template.rules.ts';
import { table } from '../extractors/table.rules.ts';
import type { Table } from 'mdast';

describe('compileUserRegex — ReDoS guard', () => {
  it(
    'compiles a safe linear pattern',
    { tags: ['invariant'], meta: { spec: 'security-compiles-a-safe-linear-pattern' } },
    () => {
      const re = compileUserRegex('^[A-Z][A-Za-z0-9]*$');
      expect(re).toBeInstanceOf(RegExp);
      expect(re.test('Hello')).toBe(true);
    },
  );

  it(
    'allows a low-degree polynomial pattern (e.g. unanchored \\d+\\.\\d+)',
    {
      tags: ['invariant'],
      meta: { spec: 'security-allows-a-low-degree-polynomial-pattern-e-g-unanchored-d-d' },
    },
    () => {
      expect(() => compileUserRegex('\\d+\\.\\d+')).not.toThrow();
    },
  );

  it(
    'rejects an exponential catastrophic-backtracking pattern',
    {
      tags: ['invariant'],
      meta: { spec: 'security-rejects-an-exponential-catastrophic-backtracking-pattern' },
    },
    () => {
      expect(() => compileUserRegex('^(a+)+$')).toThrow(DirectiveError);
      expect(() => compileUserRegex('^(a+)+$')).toThrow(/ReDoS|backtracking/);
    },
  );

  it(
    'rejects a high-degree polynomial pattern',
    { tags: ['invariant'], meta: { spec: 'security-rejects-a-high-degree-polynomial-pattern' } },
    () => {
      // (.*a){50} blows up well past degree 2.
      expect(() => compileUserRegex('(.*a){50}')).toThrow(DirectiveError);
    },
  );

  it(
    'rejects an over-long pattern',
    { tags: ['invariant'], meta: { spec: 'security-rejects-an-over-long-pattern' } },
    () => {
      const long = 'a'.repeat(201);
      expect(() => compileUserRegex(long)).toThrow(/too long/);
    },
  );

  it(
    'includes the label in the error message',
    { tags: ['invariant'], meta: { spec: 'security-includes-the-label-in-the-error-message' } },
    () => {
      expect(() => compileUserRegex('^(a+)+$', 'Version')).toThrow(/for Version/);
    },
  );
});

describe('template-supplied regex is guarded end-to-end', () => {
  it(
    'parseTemplate rejects a template whose field regex is catastrophic',
    {
      tags: ['invariant'],
      meta: { spec: 'security-parsetemplate-rejects-a-template-whose-field-regex-is-catastrophic' },
    },
    () => {
      const tpl = [
        '# Doc',
        '',
        '## 1. Meta',
        '',
        '- Field: <!-- TEMPLATE-ONLY: string; regex `^(a+)+$`; required -->',
        '',
      ].join('\n');
      expect(() => parseTemplate(tpl)).toThrow(DirectiveError);
    },
  );

  it(
    'parseTemplate accepts a template with a safe field regex',
    {
      tags: ['invariant'],
      meta: { spec: 'security-parsetemplate-accepts-a-template-with-a-safe-field-regex' },
    },
    () => {
      const tpl = [
        '# Doc',
        '',
        '## 1. Meta',
        '',
        '- Field: <!-- TEMPLATE-ONLY: string; regex `^AC-\\d+$`; required -->',
        '',
      ].join('\n');
      expect(() => parseTemplate(tpl)).not.toThrow();
    },
  );
});

describe('prototype-pollution resistance', () => {
  it(
    'a __proto__ table header does not pollute Object.prototype',
    {
      tags: ['invariant'],
      meta: { spec: 'security-a-proto-table-header-does-not-pollute-object-prototype' },
    },
    () => {
      // Hand-build a minimal mdast table with a `__proto__` header.
      const cell = (value: string): never =>
        ({ type: 'tableCell', children: [{ type: 'text', value }] }) as never;
      const tableNode = {
        type: 'table',
        align: [],
        children: [
          { type: 'tableRow', children: [cell('__proto__'), cell('name')] },
          { type: 'tableRow', children: [cell('polluted'), cell('ok')] },
        ],
      } as unknown as Table;

      const rows = table([tableNode], { section: 'X' });
      // The value is stored as an ordinary key, and the global prototype is clean.
      expect(rows[0]?.__proto__).toBe('polluted');
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
      expect((Object.prototype as Record<string, unknown>).polluted).toBe(undefined);
    },
  );
});
