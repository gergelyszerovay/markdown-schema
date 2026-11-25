import { describe, expect, it } from 'vitest';
import { DirectiveError } from '../directive/directive.error.ts';
import { parseTemplate } from './parse-template.rules.ts';

/**
 * Builds a template whose preamble carries the given summary line.
 * @param summaryLine - The line between the title and the first section, or none.
 * @returns The template text.
 */
function template(summaryLine: string): string {
  return `# Doc

${summaryLine}

## Scope

<!-- TEMPLATE-ONLY: freetext -->

Text.
`;
}

const requiredSummary = template(
  '> <!-- TEMPLATE-ONLY: string; required; regex `^[^\\n]{10,40}$` -->',
);
const optionalSummary = template('> <!-- TEMPLATE-ONLY: string; optional -->');

describe('the summary directive', () => {
  it(
    'a required summary is extracted, checked against its regex, and missing is an error',
    { tags: ['invariant'], meta: { spec: 'summary-required-extracted-and-enforced' } },
    () => {
      const parsed = parseTemplate(requiredSummary);
      const data = parsed.parse('# Doc\n\n> A ten-char summary.\n\n## Scope\n\nText.\n');
      expect(data.summary).toBe('A ten-char summary.');
      expect(() => parsed.parse('# Doc\n\n## Scope\n\nText.\n')).toThrow(
        /Missing required summary/,
      );
      expect(() => parsed.parse('# Doc\n\n> Too short\n\n## Scope\n\nText.\n')).toThrow();
    },
  );

  it(
    'an optional summary is extracted when present and left out when absent',
    { tags: ['invariant'], meta: { spec: 'summary-optional-extracted-or-left-out' } },
    () => {
      const parsed = parseTemplate(optionalSummary);
      const withIt = parsed.parse('# Doc\n\n> Present.\n\n## Scope\n\nText.\n');
      expect(withIt.summary).toBe('Present.');
      const without = parsed.parse('# Doc\n\n## Scope\n\nText.\n');
      expect(without).not.toHaveProperty('summary');
    },
  );

  it(
    'a template without the directive neither enforces nor extracts a summary',
    { tags: ['invariant'], meta: { spec: 'summary-absent-directive-is-ignored' } },
    () => {
      const parsed = parseTemplate(template(''));
      expect(parsed.shape.summary).toBeUndefined();
      const data = parsed.parse('# Doc\n\n> A stray blockquote.\n\n## Scope\n\nText.\n');
      expect(data).not.toHaveProperty('summary');
    },
  );

  it(
    'a wrapped summary blockquote is folded to one line before the regex check',
    { tags: ['edge-case'], meta: { spec: 'summary-wrapped-lines-fold-to-one' } },
    () => {
      const parsed = parseTemplate(requiredSummary);
      const data = parsed.parse(
        '# Doc\n\n> A summary wrapped\n> over two lines.\n\n## Scope\n\nText.\n',
      );
      expect(data.summary).toBe('A summary wrapped over two lines.');
    },
  );

  it(
    'a second summary directive, or one that is not a field, is a template error',
    { tags: ['invariant'], meta: { spec: 'summary-directive-shape-is-checked' } },
    () => {
      const twice = template(
        '> <!-- TEMPLATE-ONLY: string; required -->\n\n> <!-- TEMPLATE-ONLY: string; optional -->',
      );
      expect(() => parseTemplate(twice)).toThrow(/only one summary directive/);
      const enumSummary = template('> <!-- TEMPLATE-ONLY: enum: A | B; required -->');
      expect(() => parseTemplate(enumSummary)).toThrow(DirectiveError);
    },
  );
});
