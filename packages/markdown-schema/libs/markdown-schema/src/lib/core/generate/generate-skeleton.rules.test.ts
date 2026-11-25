import { describe, expect, it } from 'vitest';
import { parseTemplate } from '../template/parse-template.rules.ts';
import { readFixture } from '../../testing/read-fixture.fixture.ts';
import { generateSkeleton } from './generate-skeleton.rules.ts';

describe('generateSkeleton', () => {
  it(
    'writes a table with its header row and a placeholder row, and a freetext placeholder',
    {
      tags: ['scenario'],
      meta: {
        spec: 'generate-skeleton-table-and-freetext',
        arrange: 'a template with a defaulted table and a freetext section',
        act: 'generate the skeleton from the shape alone',
        assert:
          'the headings in order, the header row, one row with defaults and <column> placeholders, and <...> prose',
      },
    },
    () => {
      const { shape } = parseTemplate(
        '# Spec: <!-- TEMPLATE-ONLY: string; required -->\n\n## Rules\n\n| ID | Rule | Checked by |\n| - | - | - |\n\n<!-- TEMPLATE-ONLY: row\nID: string; key\nRule: string; required\nChecked by: enum: spec | review; default=review\n-->\n\n## Notes\n\n<!-- TEMPLATE-ONLY: freetext; optional -->\n',
      );
      expect(generateSkeleton(shape)).toBe(
        [
          '# Spec: <...>',
          '',
          '## Rules',
          '',
          '| ID | Rule | Checked by |',
          '| - | - | - |',
          '| <ID> | <Rule> | review |',
          '',
          '## Notes',
          '',
          '<...>',
          '',
        ].join('\n'),
      );
    },
  );

  it(
    'writes the title placeholder from the title parts: literal, field, enum',
    { tags: ['invariant'], meta: { spec: 'generate-skeleton-title-placeholders' } },
    () => {
      const titleOf = (h1: string): string =>
        generateSkeleton(
          parseTemplate(`${h1}\n\n## S\n\n<!-- TEMPLATE-ONLY: freetext -->\n`).shape,
        ).split('\n')[0] ?? '';
      expect(titleOf('# Fixed title')).toBe('# Fixed title');
      expect(titleOf('# CR-<!-- TEMPLATE-ONLY: string; regex `^\\d+$`; required -->')).toBe(
        '# CR-<...>',
      );
      expect(titleOf('# Kind: <!-- TEMPLATE-ONLY: enum: A | B; required -->')).toBe(
        '# Kind: <A | B>',
      );
      expect(titleOf('# <!-- TEMPLATE-ONLY: string; required -->')).toBe('# <...>');
    },
  );

  it(
    'writes every section kind: keys, task items, checkbox cells, groups and the summary',
    {
      tags: ['scenario'],
      meta: {
        spec: 'generate-skeleton-every-section-kind',
        arrange: 'the checklist template, which has every section kind',
        act: 'generate the skeleton',
        assert: 'each kind has its placeholder form, optional sections included',
      },
    },
    () => {
      const skeleton = generateSkeleton(
        parseTemplate(readFixture('generate/checklist.template.md')).shape,
      );
      expect(skeleton).toContain('# Checklist: <...>\n\n> <...>');
      expect(skeleton).toContain('- Owner: <Owner>\n- Stage: <Stage>\n- Note: <Note>');
      expect(skeleton).toContain('- [ ] <...>');
      expect(skeleton).toContain('| <ID> | <Check> | [ ] | nobody |');
      expect(skeleton).toContain('## Links\n\n- <...>');
      expect(skeleton).toContain('### <...>\n\n- <...>');
      expect(skeleton).toContain('| <Name> | <Value> |');
    },
  );
});
