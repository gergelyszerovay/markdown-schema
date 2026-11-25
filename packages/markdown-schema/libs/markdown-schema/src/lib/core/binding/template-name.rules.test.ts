import { describe, expect, it } from 'vitest';
import { templateNameOf, templateNamesOf } from './template-name.rules.ts';

describe('templateNameOf', () => {
  it.each([
    ['2.billing.constitution.md', 'constitution'],
    ['1.index.md', 'index'],
    ['4.index.node-lib.md', 'node-lib'],
    ['plan.md', 'plan'],
    ['README.md', 'README'],
    ['1.md', '1'],
    ['a.b.c.md', 'c'],
  ])(
    'the template name of %j is %j',
    { tags: ['invariant'], meta: { spec: 'template-name-is-the-last-segment-after-the-level' } },
    (fileName, expected) => {
      expect(templateNameOf(fileName)).toBe(expected);
    },
  );

  it(
    'has no template name for a file that is not Markdown',
    { tags: ['edge-case'], meta: { spec: 'template-name-needs-markdown' } },
    () => {
      expect(templateNameOf('a.ts')).toBeNull();
      expect(templateNameOf('.md')).toBeNull();
    },
  );

  it(
    'tries the lower-case form of an all-upper-case name after the name itself',
    { tags: ['invariant'], meta: { spec: 'template-names-fall-back-to-lower-case' } },
    () => {
      expect(templateNamesOf('CHANGELOG.md')).toEqual(['CHANGELOG', 'changelog']);
      expect(templateNamesOf('2.pkg.README.md')).toEqual(['README', 'readme']);
      expect(templateNamesOf('plan.md')).toEqual(['plan']);
      expect(templateNamesOf('Plan.md')).toEqual(['Plan']);
      expect(templateNamesOf('a.ts')).toEqual([]);
    },
  );
});
