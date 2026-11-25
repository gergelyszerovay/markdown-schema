import { describe, expect, it } from 'vitest';
import { DirectiveError } from '../directive/directive.error.ts';
import { parseTemplate } from './parse-template.rules.ts';

/**
 * Builds a template with two declared sections and the given document directive line.
 * @param directive - The directive comment placed after the title, or none.
 * @returns The template text.
 */
function template(directive: string): string {
  return `# Plan

${directive}

## Scope

<!-- TEMPLATE-ONLY: freetext -->

Text.

## Decisions

<!-- TEMPLATE-ONLY: freetext; optional -->

Text.
`;
}

const withExtra = `# Plan

## Scope

Scope text.

## Sketch

Free words.

### A sub-heading

More.

## Decisions

Decision text.
`;

describe('the document directive', () => {
  it(
    'a section the template does not declare is rejected without open',
    { tags: ['invariant'], meta: { spec: 'document-undeclared-section-rejected-by-default' } },
    () => {
      expect(() => parseTemplate(template('')).parse(withExtra)).toThrow(/Unrecognized section/);
      expect(() =>
        parseTemplate(template('<!-- TEMPLATE-ONLY: document -->')).parse(withExtra),
      ).toThrow(/Unrecognized section/);
    },
  );

  it(
    'open accepts an undeclared section and parses it as free text with its heading and key',
    { tags: ['invariant'], meta: { spec: 'document-open-parses-undeclared-sections' } },
    () => {
      const data = parseTemplate(template('<!-- TEMPLATE-ONLY: document; open -->')).parse(
        withExtra,
      );
      expect(data.additionalSections).toEqual([
        { key: 'sketch', heading: 'Sketch', text: 'Free words.\n\n### A sub-heading\n\nMore.' },
      ]);
      expect(data.scope).toBe('Scope text.');
    },
  );

  it(
    'open leaves additionalSections out when the document has none',
    { tags: ['edge-case'], meta: { spec: 'document-open-without-extras' } },
    () => {
      const data = parseTemplate(template('<!-- TEMPLATE-ONLY: document; open -->')).parse(
        '# Plan\n\n## Scope\n\nText.\n',
      );
      expect(data).not.toHaveProperty('additionalSections');
    },
  );

  it(
    'declared sections out of order are rejected without unordered',
    { tags: ['invariant'], meta: { spec: 'document-out-of-order-rejected-by-default' } },
    () => {
      const swapped = '# Plan\n\n## Decisions\n\nD.\n\n## Scope\n\nS.\n';
      expect(() => parseTemplate(template('')).parse(swapped)).toThrow(/out of order/);
    },
  );

  it(
    'unordered accepts the declared sections in any order',
    { tags: ['invariant'], meta: { spec: 'document-unordered-accepts-any-order' } },
    () => {
      const swapped = '# Plan\n\n## Decisions\n\nD.\n\n## Scope\n\nS.\n';
      const data = parseTemplate(template('<!-- TEMPLATE-ONLY: document; unordered -->')).parse(
        swapped,
      );
      expect(data).toMatchObject({ scope: 'S.', decisions: 'D.' });
    },
  );

  it(
    'a required section stays required when the template is open and unordered',
    { tags: ['edge-case'], meta: { spec: 'document-open-keeps-required-sections' } },
    () => {
      const open = parseTemplate(template('<!-- TEMPLATE-ONLY: document; open; unordered -->'));
      expect(() => open.parse('# Plan\n\n## Sketch\n\nWords.\n')).toThrow(
        /Missing required section: "Scope"/,
      );
    },
  );

  it(
    'a second document directive, or one inside a section, is a template error',
    { tags: ['invariant'], meta: { spec: 'document-directive-placement' } },
    () => {
      const twice = template(
        '<!-- TEMPLATE-ONLY: document; open -->\n\n<!-- TEMPLATE-ONLY: document; unordered -->',
      );
      expect(() => parseTemplate(twice)).toThrow(DirectiveError);
      const inSection = template('').replace(
        '## Scope\n',
        '## Scope\n\n<!-- TEMPLATE-ONLY: document; open -->\n',
      );
      expect(() => parseTemplate(inSection)).toThrow(/belongs between the title/);
    },
  );
});
