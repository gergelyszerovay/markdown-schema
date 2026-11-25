import { describe, expect, it } from 'vitest';
import type { DocumentData } from '../doc-schema/document-data.model.ts';
import { parseTemplate } from '../template/parse-template.rules.ts';
import type { ParsedTemplate } from '../template/parse-template.rules.ts';
import { loadExampleRefine, readExample, readFixture } from '../../testing/read-fixture.fixture.ts';
import { generateDocument } from './generate-document.rules.ts';

const checklist = parseTemplate(readFixture('generate/checklist.template.md'));

const component = parseTemplate(readExample('component/component.template.md'), {
  refine: await loadExampleRefine('component/component'),
});

/** The round-trip corpus: a template and the valid documents bound to it. */
const corpus: { name: string; template: ParsedTemplate; documents: string[] }[] = [
  {
    name: 'checklist (every section kind, task-list rules, checkbox column)',
    template: checklist,
    documents: [readFixture('generate/checklist-valid.md')],
  },
  {
    name: 'all-features',
    template: parseTemplate(readExample('all-features/all-features.template.md')),
    documents: [readExample('all-features/all-features.md')],
  },
  {
    name: 'release-notes',
    template: parseTemplate(
      readExample(
        'release-notes/markdown-schema-templates/release-notes/release-notes.template.md',
      ),
    ),
    documents: [readExample('release-notes/release-notes.md')],
  },
  {
    name: 'component',
    template: component,
    documents: [
      readExample('component/example.md'),
      readFixture('component-spec/valid-minimal.md'),
      readFixture('component-spec/valid-full.md'),
      readFixture('component-spec/valid-primitive.md'),
    ],
  },
  {
    name: 'constitution',
    template: parseTemplate(readFixture('json-schema/constitution.template.md')),
    documents: [readFixture('json-schema/constitution-valid.md')],
  },
  {
    name: 'region',
    template: parseTemplate(readFixture('json-schema/region.template.md')),
    documents: [readFixture('json-schema/region-valid.md')],
  },
];

describe('generateDocument: the round-trip law', () => {
  for (const { name, template, documents } of corpus) {
    it.each(documents.map((document, index) => [index, document] as const))(
      `${name}: parse(generate(shape, data)) deep-equals data (document %i)`,
      {
        tags: ['invariant'],
        meta: { spec: 'generate-document-round-trip-over-the-fixture-corpus' },
      },
      (_index, document) => {
        const data = template.parse(document);
        const generated = generateDocument(template.shape, data);
        expect(template.parse(generated)).toEqual(data);
        // Generating again from the reparsed data is a fixed point.
        expect(generateDocument(template.shape, template.parse(generated))).toBe(generated);
      },
    );
  }
});

const checklistData = checklist.parse(readFixture('generate/checklist-valid.md'));

/**
 * Generates a document from the checklist data with some members replaced.
 * @param changes - The members to replace.
 * @returns The generated markdown.
 */
function generateWith(changes: DocumentData, options?: { validate?: boolean }): string {
  return generateDocument(checklist.shape, { ...checklistData, ...changes }, options);
}

describe('generateDocument: writing', () => {
  it(
    'writes the parts in template order, with unaligned GFM tables and checkbox literals',
    {
      tags: ['scenario'],
      meta: {
        spec: 'generate-document-writes-parts-in-template-order',
        arrange: 'the checklist template and the data of its valid document',
        act: 'generate the document',
        assert: 'the frontmatter, title, summary and sections come in order, tables unaligned',
      },
    },
    () => {
      const text = generateDocument(checklist.shape, checklistData);
      const headings = text.split('\n').filter((line) => /^#{1,3} /.test(line));
      expect(headings).toEqual([
        '# Checklist: release-day',
        '## Identity',
        '## Steps',
        '## Checks',
        '## Changes',
        '### add: a thing',
        '### fix: another',
        '## Table without rules',
        '## Notes',
        '## Appendix',
      ]);
      expect(text.startsWith('---\ndraft: true\nversion: 2\n')).toBe(true);
      expect(text).toContain('| ID | Check | Done | Owner |\n| - | - | - | - |');
      expect(text).toContain('| C1 | Look at it | [x] | Ana |');
      expect(text).toContain('- [x] Build it\n- [ ] Ship it');
      expect(text.endsWith('\n')).toBe(true);
    },
  );

  it(
    'leaves out an optional section the data does not hold',
    {
      tags: ['scenario'],
      meta: {
        spec: 'generate-document-omits-absent-optional-sections',
        arrange: 'checklist data without the Notes section',
        act: 'generate and parse back',
        assert: 'no Notes heading, and the parse result has no notes',
      },
    },
    () => {
      const rest = Object.fromEntries(
        Object.entries(checklistData).filter(([key]) => key !== 'notes'),
      );
      const text = generateDocument(checklist.shape, rest);
      expect(text).not.toContain('## Notes');
      expect(checklist.parse(text)).toEqual(rest);
    },
  );

  it(
    'writes frontmatter with booleans and numbers, and accepts it in the data type',
    { tags: ['invariant'], meta: { spec: 'generate-document-frontmatter-any-values' } },
    () => {
      const data: DocumentData = {
        ...checklistData,
        frontmatter: { draft: false, n: 3, deep: { a: [1] } },
      };
      const parsed = checklist.parse(generateDocument(checklist.shape, data));
      expect(parsed.frontmatter).toEqual({ draft: false, n: 3, deep: { a: [1] } });
    },
  );

  it(
    'a value that looks like markdown stays literal text',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'generate-document-markdown-looking-values-stay-text',
        arrange: 'a cell holding [text](url), emphasis, code and a pipe',
        act: 'generate and parse back',
        assert: 'the cell parses back to the same string',
      },
    },
    () => {
      const value = '[text](https://x.y) *a* `b` a|b <i> # not a heading';
      const rows = [{ ID: 'C1', Check: value, Done: false, Owner: 'x' }];
      const text = generateWith({ checks: rows }, { validate: false });
      expect((checklist.parse(text).checks as typeof rows)[0]?.Check).toBe(value);
    },
  );

  it(
    'a www address and an e-mail address read back unchanged',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'generate-document-autolink-literals-read-back-unchanged',
        arrange: 'cells and list items holding www. and e-mail text, which GFM would link',
        act: 'generate and parse back',
        assert: 'the strings are unchanged, not their URLs',
      },
    },
    () => {
      const value = 'see www.example.com and me@example.org, or https://example.com/a_b.';
      const rows = [{ ID: 'C1', Check: value, Done: false, Owner: 'x' }];
      const changes = { checks: rows, links: [value] };
      const back = checklist.parse(generateWith(changes));
      expect((back.checks as typeof rows)[0]?.Check).toBe(value);
      expect(back.links).toEqual([value]);
    },
  );

  it(
    'a sparse row round-trips: a trailing absent optional cell stays absent',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'generate-document-sparse-rows-round-trip',
        arrange: 'a table row with fewer cells than headers',
        act: 'generate and parse back',
        assert: 'the row has no key for the missing cell',
      },
    },
    () => {
      const template = parseTemplate(
        '# T\n\n## Items\n\n| A | B | C |\n| - | - | - |\n\n<!-- TEMPLATE-ONLY: row\nA: string; required\nB: string; optional\nC: string; optional\n-->\n',
      );
      const doc =
        '# T\n\n## Items\n\n| A | B | C |\n| - | - | - |\n| a |\n| a | b |\n| a | b | c |\n';
      const data = template.parse(doc);
      expect(data.items).toEqual([{ A: 'a' }, { A: 'a', B: 'b' }, { A: 'a', B: 'b', C: 'c' }]);
      const text = generateDocument(template.shape, data);
      expect(text).toContain('| a |\n| a | b |\n| a | b | c |');
      expect(template.parse(text)).toEqual(data);
    },
  );

  it(
    'a soft line break in a list item survives; one in a table cell, title or summary throws',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'generate-document-line-breaks',
        arrange: 'a plain-list item with a line break, then a cell and a title with one',
        act: 'generate',
        assert: 'the list item parses back; the others throw',
      },
    },
    () => {
      const wrapped = 'a wrapped\nitem';
      expect(checklist.parse(generateWith({ links: [wrapped] })).links).toEqual([wrapped]);
      const rows = [{ ID: 'C1', Check: 'a\nb', Done: false, Owner: 'x' }];
      expect(() => generateWith({ checks: rows }, { validate: false })).toThrow(
        /cannot contain a line break/,
      );
      expect(() => generateWith({ title: 'a\nb' }, { validate: false })).toThrow(
        /cannot contain a line break/,
      );
      expect(() => generateWith({ summary: 'a\nb' }, { validate: false })).toThrow(
        /cannot contain a line break/,
      );
    },
  );

  it(
    'writes the additional sections of an open template after the declared ones, and only then',
    {
      tags: ['scenario'],
      meta: {
        spec: 'generate-document-additional-sections-only-when-open',
        arrange: 'data with an additional section, for an open and a closed shape',
        act: 'generate',
        assert: 'the open shape writes the heading and text; the closed shape leaves it out',
      },
    },
    () => {
      expect(generateDocument(checklist.shape, checklistData)).toContain(
        '## Appendix\n\nExtra section text.',
      );
      const closed = { ...checklist.shape, open: false };
      expect(generateDocument(closed, checklistData, { validate: false })).not.toContain(
        'Appendix',
      );
    },
  );
});

describe('generateDocument: freetext', () => {
  const freetexts = [
    '* a\n* b',
    '| a | b |\n|-|-|\n| 1 | 2 |',
    '```ts\nx\n```',
    '1) one\n2) two',
    'text  \nbreak',
    '> q\n\n---\n\n### h',
    '- [ ] t\n- [x] u',
    'a *b* __c__ <http://x.y> https://z.w',
  ];

  it.each(freetexts)(
    'serialise, reparse and serialise again gives the same string: %j',
    { tags: ['invariant'], meta: { spec: 'freetext-serialisation-is-idempotent' } },
    async (source) => {
      const { freetext } = await import('../extractors/freetext.rules.ts');
      const { parseSection } = await import('../../testing/parse-section.fixture.ts');
      const once = freetext(parseSection(source), { section: 'S' });
      const twice = freetext(parseSection(once), { section: 'S' });
      expect(twice).toBe(once);
    },
  );
});

describe('generateDocument: validation', () => {
  const wrongCheckboxes: [string, unknown][] = [
    ['a string', 'yes'],
    ['the string true', 'true'],
    ['a marker', '[x]'],
    ['a number', 1],
    ['null', null],
  ];

  it.each(wrongCheckboxes)(
    'refuses a checkbox cell that is %s, naming the section and column',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'generate-document-refuses-wrong-typed-checkbox',
        arrange: 'checklist data whose Done cell holds a non-boolean',
        act: 'generate',
        assert: 'it throws, naming the section, row and column',
      },
    },
    (_title, value) => {
      const rows = [{ ID: 'C1', Check: 'a', Done: value, Owner: 'x' }];
      expect(() => generateWith({ checks: rows })).toThrow(/Section "Checks" row 1 cell "Done"/);
    },
  );

  it(
    'refuses the other wrong-typed values the writer would have dropped or coerced',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'generate-document-refuses-silent-coercions',
        arrange: 'checklist data with one wrong-typed value at a time',
        act: 'generate',
        assert: 'each throws and names where',
      },
    },
    () => {
      const cases: [Record<string, unknown>, RegExp][] = [
        [{ title: 3 }, /The title/],
        [{ summary: 3 }, /The summary/],
        [{ notes: 3 }, /Section "Notes"/],
        [{ checks: 'none' }, /Section "Checks": expected an array/],
        [{ checks: [{ ID: 'C1', Check: 4, Done: true, Owner: 'x' }] }, /cell "Check"/],
        [{ steps: [{ checked: 'yes', text: 'Build it' }] }, /Section "Steps" item 1/],
        [{ links: [3] }, /Section "Links" item 1/],
        [{ missing: 'x' }, /"missing" is not declared/],
      ];
      for (const [changes, message] of cases) {
        expect(() => generateWith(changes as DocumentData), JSON.stringify(changes)).toThrow(
          message,
        );
      }
    },
  );

  it(
    'refuses data that does not validate and writes nothing, listing every failure',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'generate-document-refuses-invalid-data',
        arrange: 'checklist data without its title and with a wrong-typed checkbox',
        act: 'generate',
        assert: 'one error lists both failures',
      },
    },
    () => {
      const rows = [{ ID: 'C1', Check: 'a', Done: 'yes', Owner: 'x' }];
      expect(() => generateWith({ title: undefined, checks: rows })).toThrow(
        /The title: is required[\s\S]*cell "Done"/,
      );
    },
  );

  it(
    '`validate: false` skips the check and writes what it is given, as 0.9.0 did',
    {
      tags: ['scenario'],
      meta: {
        spec: 'generate-document-validate-false-reproduces-unchecked-writing',
        arrange: 'a wrong-typed checkbox',
        act: 'generate with and without the option',
        assert: 'the default throws; the opt-out writes an unchecked box',
      },
    },
    () => {
      const rows = [{ ID: 'C1', Check: 'a', Done: 'yes', Owner: 'x' }];
      expect(() => generateWith({ checks: rows })).toThrow();
      expect(generateWith({ checks: rows }, { validate: false })).toContain('| C1 | a | [ ] | x |');
      expect(generateWith({}, { validate: false })).toBe(generateWith({}));
    },
  );
});
