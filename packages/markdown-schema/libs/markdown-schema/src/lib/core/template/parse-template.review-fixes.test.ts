import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { parseTemplate } from './parse-template.rules.ts';
import { parseDirective } from '../directive/parse-directive.rules.ts';
import { DirectiveError } from '../directive/directive.error.ts';
import { cellText } from '../extractors/cell-text.rules.ts';

// Helpers to build small templates/docs -------------------------------------

const lines = (...l: string[]): string => l.join('\n');

// ---------------------------------------------------------------------------
// P1.1 — required table columns reject empty cells (.min(1))
// ---------------------------------------------------------------------------

describe('required table column rejects empty cell', () => {
  const tpl = lines(
    '# T',
    '',
    '## 1. Rows',
    '',
    '| A | B |',
    '| - | - |',
    '<!-- TEMPLATE-ONLY: row',
    'A: string; required',
    'B: string; required',
    '-->',
    '| x | y |',
  );
  const schema = parseTemplate(tpl);

  it(
    'rejects a row with an empty required cell',
    {
      tags: ['invariant'],
      meta: { spec: 'review-fixes-rejects-a-row-with-an-empty-required-cell' },
    },
    () => {
      const doc = '# T\n\n## 1. Rows\n\n| A | B |\n| - | - |\n| x |   |\n';
      expect(() => schema.parse(doc)).toThrow(ZodError);
    },
  );

  it(
    'accepts a row with both cells filled',
    { tags: ['invariant'], meta: { spec: 'review-fixes-accepts-a-row-with-both-cells-filled' } },
    () => {
      const doc = '# T\n\n## 1. Rows\n\n| A | B |\n| - | - |\n| x | y |\n';
      expect(() => schema.parse(doc)).not.toThrow();
    },
  );
});

// ---------------------------------------------------------------------------
// P1.2 — numeric modifiers reject garbage / negatives
// ---------------------------------------------------------------------------

describe('numeric modifier validation', () => {
  it.each([
    'row; min-rows: lots\nA: string; required',
    'row; max-rows: -1\nA: string; required',
    'row; min-rows: 1.5\nA: string; required',
  ])(
    "row directive rejects '%s'",
    { tags: ['invariant'], meta: { spec: 'review-fixes-row-directive-rejects' } },
    (body) => {
      expect(() => parseDirective(body)).toThrow(DirectiveError);
    },
  );

  it.each(['section; min-groups: lots', 'section; max-groups: -3'])(
    "section directive rejects '%s'",
    { tags: ['invariant'], meta: { spec: 'review-fixes-section-directive-rejects' } },
    (body) => {
      expect(() => parseDirective(body)).toThrow(DirectiveError);
    },
  );

  it(
    'accepts a valid integer min-rows',
    { tags: ['invariant'], meta: { spec: 'review-fixes-accepts-a-valid-integer-min-rows' } },
    () => {
      const d = parseDirective('row; min-rows: 2\nA: string; required');
      expect(d.kind).toBe('row');
      if (d.kind === 'row') expect(d.minRows).toBe(2);
    },
  );
});

// ---------------------------------------------------------------------------
// P2.3 — unknown modifiers are hard errors everywhere
// ---------------------------------------------------------------------------

describe('unknown modifiers rejected', () => {
  it(
    'field: typo modifier',
    { tags: ['invariant'], meta: { spec: 'review-fixes-field-typo-modifier' } },
    () => {
      expect(() => parseDirective('string; optionall')).toThrow(/unknown field modifier/);
    },
  );
  it(
    'enum: unknown modifier',
    { tags: ['invariant'], meta: { spec: 'review-fixes-enum-unknown-modifier' } },
    () => {
      expect(() => parseDirective('enum: A | B; bogus')).toThrow(/unknown enum modifier/);
    },
  );
  it(
    'row opener: unknown modifier',
    { tags: ['invariant'], meta: { spec: 'review-fixes-row-opener-unknown-modifier' } },
    () => {
      expect(() => parseDirective('row; bogus\nA: string; required')).toThrow(
        /unknown row modifier/,
      );
    },
  );
  it(
    'section: unknown modifier',
    { tags: ['invariant'], meta: { spec: 'review-fixes-section-unknown-modifier' } },
    () => {
      expect(() => parseDirective('section; bogus')).toThrow(/unknown section modifier/);
    },
  );
  it(
    'column: unknown modifier',
    { tags: ['invariant'], meta: { spec: 'review-fixes-column-unknown-modifier' } },
    () => {
      expect(() => parseDirective('row\nA: string; bogus')).toThrow(/unknown column modifier/);
    },
  );
});

// ---------------------------------------------------------------------------
// P2.4 — malformed / missing regex backticks
// ---------------------------------------------------------------------------

describe('malformed regex modifier rejected', () => {
  it(
    'field regex without backticks',
    { tags: ['invariant'], meta: { spec: 'review-fixes-field-regex-without-backticks' } },
    () => {
      expect(() => parseDirective('string; regex ^x$; required')).toThrow(/backticks/);
    },
  );
  it(
    'column regex without backticks',
    { tags: ['invariant'], meta: { spec: 'review-fixes-column-regex-without-backticks' } },
    () => {
      expect(() => parseDirective('row\nA: string; regex ^x$; required')).toThrow(/backticks/);
    },
  );
});

// ---------------------------------------------------------------------------
// P2.5 — tolerant opener spelling can't bypass the inline-close pre-check
// ---------------------------------------------------------------------------

describe('opener matching alignment', () => {
  it(
    "rejects an unclosed inline directive spelled '<!--TEMPLATE-ONLY:' (no space)",
    {
      tags: ['invariant'],
      meta: {
        spec: 'review-fixes-rejects-an-unclosed-inline-directive-spelled-template-only-no-space',
      },
    },
    () => {
      const bad = lines(
        '# Doc',
        '',
        '## 1. Section',
        '',
        '- Field: <!--TEMPLATE-ONLY: string; required',
        '',
      );
      expect(() => parseTemplate(bad)).toThrow(DirectiveError);
    },
  );
});

// ---------------------------------------------------------------------------
// P2.6 — wrong directive kind in a position → hard error
// ---------------------------------------------------------------------------

describe('wrong directive kind rejected', () => {
  it(
    'H1 title with a non-field/enum directive',
    {
      tags: ['invariant'],
      meta: { spec: 'review-fixes-h1-title-with-a-non-field-enum-directive' },
    },
    () => {
      const bad = lines(
        '# Title: <!-- TEMPLATE-ONLY: freetext -->',
        '',
        '## 1. Section',
        '',
        '<!-- TEMPLATE-ONLY: freetext; required -->',
      );
      expect(() => parseTemplate(bad)).toThrow(/H1 title only supports/);
    },
  );

  it(
    'labeled-list item with a block (guide) directive',
    {
      tags: ['invariant'],
      meta: { spec: 'review-fixes-labeled-list-item-with-a-block-guide-directive' },
    },
    () => {
      const bad = lines('# Doc', '', '## 1. Section', '', '- Foo: <!-- TEMPLATE-ONLY: guide -->');
      expect(() => parseTemplate(bad)).toThrow(/labeled-list item/);
    },
  );
});

// ---------------------------------------------------------------------------
// P2.7 — required + only-if is contradictory
// ---------------------------------------------------------------------------

describe('required + only-if rejected', () => {
  it(
    'bare only-if without optional (implicitly required)',
    {
      tags: ['invariant'],
      meta: { spec: 'review-fixes-bare-only-if-without-optional-implicitly-required' },
    },
    () => {
      expect(() => parseDirective('string; only-if Type=Primitive')).toThrow(/contradictory/);
    },
  );
  it(
    'explicit required + only-if',
    { tags: ['invariant'], meta: { spec: 'review-fixes-explicit-required-only-if' } },
    () => {
      expect(() => parseDirective('string; required; only-if Type=Primitive')).toThrow(
        /contradictory/,
      );
    },
  );
  it(
    'optional + only-if is fine',
    { tags: ['invariant'], meta: { spec: 'review-fixes-optional-only-if-is-fine' } },
    () => {
      const d = parseDirective('string; optional; only-if Type=Primitive');
      expect(d.kind).toBe('field');
    },
  );
});

// ---------------------------------------------------------------------------
// P2.8 — cellText rejects reference-style links
// ---------------------------------------------------------------------------

describe('cellText linkReference', () => {
  it(
    'throws on a linkReference node',
    { tags: ['invariant'], meta: { spec: 'review-fixes-throws-on-a-linkreference-node' } },
    () => {
      expect(() =>
        cellText({
          type: 'linkReference',
          children: [{ type: 'text', value: 'x' }],
        }),
      ).toThrow(/reference-style link/);
    },
  );
  it(
    'stringifies an inline link to its url',
    { tags: ['invariant'], meta: { spec: 'review-fixes-stringifies-an-inline-link-to-its-url' } },
    () => {
      expect(cellText({ type: 'link', url: '../a.md', children: [] })).toBe('../a.md');
    },
  );
});

// ---------------------------------------------------------------------------
// P3.9 — extra H2 sections rejected
// ---------------------------------------------------------------------------

describe('extra H2 section rejected', () => {
  const tpl = lines(
    '# Doc',
    '',
    '## 1. Summary',
    '',
    '<!-- TEMPLATE-ONLY: freetext; required -->',
    '',
    'Body.',
  );
  const schema = parseTemplate(tpl);

  it(
    'rejects an unknown extra section',
    { tags: ['invariant'], meta: { spec: 'review-fixes-rejects-an-unknown-extra-section' } },
    () => {
      const doc = lines(
        '# Doc',
        '',
        '## 1. Summary',
        '',
        'Body.',
        '',
        '## 2. Sneaky Extra',
        '',
        'Nope.',
      );
      expect(() => schema.parse(doc)).toThrow(/Unrecognized section/);
    },
  );
});

// ---------------------------------------------------------------------------
// P3.10 — undeclared labeled-list keys + pure-link bullets
// ---------------------------------------------------------------------------

describe('labeled-list additions', () => {
  const tpl = lines(
    '# Doc',
    '',
    '## 1. Meta',
    '',
    '- Name: <!-- TEMPLATE-ONLY: string; required -->',
  );
  const schema = parseTemplate(tpl);

  it(
    'rejects an undeclared key',
    { tags: ['invariant'], meta: { spec: 'review-fixes-rejects-an-undeclared-key' } },
    () => {
      const doc = '# Doc\n\n## 1. Meta\n\n- Name: Foo\n- Undeclared: sneaky\n';
      expect(() => schema.parse(doc)).toThrow(/Unrecognized key/);
    },
  );

  it(
    'ignores a bare-link bullet instead of minting a junk key',
    {
      tags: ['invariant'],
      meta: { spec: 'review-fixes-ignores-a-bare-link-bullet-instead-of-minting-a-junk-key' },
    },
    () => {
      const doc = '# Doc\n\n## 1. Meta\n\n- Name: Foo\n- [guide](https://example.com/guide)\n';
      const out = schema.parse(doc);
      const meta = out.meta as Record<string, unknown>;
      expect(meta.Name).toBe('Foo');
      expect(meta.https).toBeUndefined();
    },
  );
});

// ---------------------------------------------------------------------------
// P2.5/11 — key collisions and duplicate headings
// ---------------------------------------------------------------------------

describe('key collisions and duplicate headings', () => {
  it(
    'template: two H2s collapsing to the same key',
    {
      tags: ['invariant'],
      meta: { spec: 'review-fixes-template-two-h2s-collapsing-to-the-same-key' },
    },
    () => {
      const bad = lines(
        '# Doc',
        '',
        '## 1. Inputs (Props)',
        '',
        '<!-- TEMPLATE-ONLY: freetext; required -->',
        '',
        '## 2. Inputs / Other',
        '',
        '<!-- TEMPLATE-ONLY: freetext; required -->',
      );
      expect(() => parseTemplate(bad)).toThrow(/collides/);
    },
  );

  it(
    'template: duplicate H2 text',
    { tags: ['invariant'], meta: { spec: 'review-fixes-template-duplicate-h2-text' } },
    () => {
      const bad = lines(
        '# Doc',
        '',
        '## 1. Same',
        '',
        '<!-- TEMPLATE-ONLY: freetext; required -->',
        '',
        '## 1. Same',
        '',
        '<!-- TEMPLATE-ONLY: freetext; required -->',
      );
      expect(() => parseTemplate(bad)).toThrow(/duplicate H2/);
    },
  );

  it(
    'document: duplicate H2 text',
    { tags: ['invariant'], meta: { spec: 'review-fixes-document-duplicate-h2-text' } },
    () => {
      const tpl = lines(
        '# Doc',
        '',
        '## 1. Summary',
        '',
        '<!-- TEMPLATE-ONLY: freetext; required -->',
      );
      const schema = parseTemplate(tpl);
      const doc = lines('# Doc', '', '## 1. Summary', '', 'A.', '', '## 1. Summary', '', 'B.');
      expect(() => schema.parse(doc)).toThrow(/Duplicate section heading/);
    },
  );
});

// ---------------------------------------------------------------------------
// P4.12 — default= is applied
// ---------------------------------------------------------------------------

describe('default= application', () => {
  it(
    'fills a blank labeled field with its default',
    {
      tags: ['invariant'],
      meta: { spec: 'review-fixes-fills-a-blank-labeled-field-with-its-default' },
    },
    () => {
      const tpl = lines(
        '# Doc',
        '',
        '## 1. Meta',
        '',
        '- Name: <!-- TEMPLATE-ONLY: string; required -->',
        '- Stage: <!-- TEMPLATE-ONLY: string; optional; default=Alpha -->',
      );
      const schema = parseTemplate(tpl);
      const doc = '# Doc\n\n## 1. Meta\n\n- Name: Foo\n- Stage:\n';
      const out = schema.parse(doc);
      expect((out.meta as Record<string, unknown>).Stage).toBe('Alpha');
    },
  );

  it(
    'fills a blank table cell with its default',
    {
      tags: ['invariant'],
      meta: { spec: 'review-fixes-fills-a-blank-table-cell-with-its-default' },
    },
    () => {
      const tpl = lines(
        '# Doc',
        '',
        '## 1. Rows',
        '',
        '| A | Notes |',
        '| - | ----- |',
        '<!-- TEMPLATE-ONLY: row',
        'A: string; required',
        'Notes: string; default=n/a',
        '-->',
        '| x | y |',
      );
      const schema = parseTemplate(tpl);
      const doc = '# Doc\n\n## 1. Rows\n\n| A | Notes |\n| - | ----- |\n| x |   |\n';
      const out = schema.parse(doc);
      const rows = out.rows as Record<string, unknown>[];
      expect(rows[0]?.Notes).toBe('n/a');
    },
  );

  it(
    'rejects required + default= as contradictory',
    {
      tags: ['invariant'],
      meta: { spec: 'review-fixes-rejects-required-default-as-contradictory' },
    },
    () => {
      expect(() => parseDirective('string; required; default=X')).toThrow(/contradictory/);
    },
  );
});

// ---------------------------------------------------------------------------
// P4.13 — remove-if enforcement
// ---------------------------------------------------------------------------

describe('remove-if enforcement', () => {
  const tpl = lines(
    '# Doc',
    '',
    '## 1. Meta',
    '',
    '- Type: <!-- TEMPLATE-ONLY: enum: View | Other; required -->',
    '',
    '## 2. Source',
    '',
    '<!-- TEMPLATE-ONLY: section; optional; remove-if Type=View -->',
    '',
    '<!-- TEMPLATE-ONLY: freetext; optional -->',
    '',
    'Body.',
  );
  const schema = parseTemplate(tpl);

  it(
    'fails when the guarded section is present and the guard holds',
    {
      tags: ['invariant'],
      meta: { spec: 'review-fixes-fails-when-the-guarded-section-is-present-and-the-guard-holds' },
    },
    () => {
      const doc = lines(
        '# Doc',
        '',
        '## 1. Meta',
        '',
        '- Type: View',
        '',
        '## 2. Source',
        '',
        'Present.',
      );
      expect(() => schema.parse(doc)).toThrow(/must be removed when Type=View/);
    },
  );

  it(
    'passes when the guarded section is absent and the guard holds',
    {
      tags: ['invariant'],
      meta: { spec: 'review-fixes-passes-when-the-guarded-section-is-absent-and-the-guard-holds' },
    },
    () => {
      const doc = '# Doc\n\n## 1. Meta\n\n- Type: View\n';
      expect(() => schema.parse(doc)).not.toThrow();
    },
  );

  it(
    'passes when the guard does not hold',
    { tags: ['invariant'], meta: { spec: 'review-fixes-passes-when-the-guard-does-not-hold' } },
    () => {
      const doc = lines(
        '# Doc',
        '',
        '## 1. Meta',
        '',
        '- Type: Other',
        '',
        '## 2. Source',
        '',
        'Present.',
      );
      expect(() => schema.parse(doc)).not.toThrow();
    },
  );

  it(
    'template error when the remove-if key is undeclared',
    {
      tags: ['invariant'],
      meta: { spec: 'review-fixes-template-error-when-the-remove-if-key-is-undeclared' },
    },
    () => {
      const bad = lines(
        '# Doc',
        '',
        '## 1. Meta',
        '',
        '- Type: <!-- TEMPLATE-ONLY: enum: View | Other; required -->',
        '',
        '## 2. Source',
        '',
        '<!-- TEMPLATE-ONLY: section; optional; remove-if Missing=View -->',
        '',
        '<!-- TEMPLATE-ONLY: freetext; optional -->',
        '',
        'Body.',
      );
      expect(() => parseTemplate(bad)).toThrow(/not declared in any/);
    },
  );
});

// ---------------------------------------------------------------------------
// P5.14 — section ordering
// ---------------------------------------------------------------------------

describe('section ordering', () => {
  const tpl = lines(
    '# Doc',
    '',
    '## 1. Alpha',
    '',
    '<!-- TEMPLATE-ONLY: freetext; required -->',
    '',
    '## 2. Beta',
    '',
    '<!-- TEMPLATE-ONLY: freetext; required -->',
  );

  it(
    'rejects out-of-order sections by default',
    {
      tags: ['invariant'],
      meta: { spec: 'review-fixes-rejects-out-of-order-sections-by-default' },
    },
    () => {
      const schema = parseTemplate(tpl);
      const doc = lines('# Doc', '', '## 2. Beta', '', 'B.', '', '## 1. Alpha', '', 'A.');
      expect(() => schema.parse(doc)).toThrow(/out of order/);
    },
  );

  it(
    'allows any order with orderedSections: false',
    {
      tags: ['invariant'],
      meta: { spec: 'review-fixes-allows-any-order-with-orderedsections-false' },
    },
    () => {
      const schema = parseTemplate(tpl, { orderedSections: false });
      const doc = lines('# Doc', '', '## 2. Beta', '', 'B.', '', '## 1. Alpha', '', 'A.');
      expect(() => schema.parse(doc)).not.toThrow();
    },
  );
});

// ---------------------------------------------------------------------------
// P5.15 — optional section present-but-malformed fails loudly
// ---------------------------------------------------------------------------

describe('optional section semantics', () => {
  const tpl = lines(
    '# Doc',
    '',
    '## 1. Summary',
    '',
    '<!-- TEMPLATE-ONLY: freetext; required -->',
    '',
    '## 2. Notes',
    '',
    '<!-- TEMPLATE-ONLY: section; optional -->',
    '',
    '| Key | Value |',
    '| --- | ----- |',
    '<!-- TEMPLATE-ONLY: row',
    'Key: string; required',
    'Value: string; required',
    '-->',
    '| k | v |',
  );
  const schema = parseTemplate(tpl);

  it(
    'accepts the doc when the optional section is absent',
    {
      tags: ['invariant'],
      meta: { spec: 'review-fixes-accepts-the-doc-when-the-optional-section-is-absent' },
    },
    () => {
      const doc = '# Doc\n\n## 1. Summary\n\nBody.\n';
      expect(() => schema.parse(doc)).not.toThrow();
    },
  );

  it(
    'fails when the optional section is present but malformed',
    {
      tags: ['invariant'],
      meta: { spec: 'review-fixes-fails-when-the-optional-section-is-present-but-malformed' },
    },
    () => {
      const doc = lines(
        '# Doc',
        '',
        '## 1. Summary',
        '',
        'Body.',
        '',
        '## 2. Notes',
        '',
        'Just prose, no table.',
      );
      expect(() => schema.parse(doc)).toThrow(/must contain a table/);
    },
  );
});
