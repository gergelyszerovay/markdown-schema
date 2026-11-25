import { describe, expect, it } from 'vitest';
import type { List } from 'mdast';
import { parseSection } from '../../testing/parse-section.fixture.ts';
import { isLabeledList } from './is-labeled-list.rules.ts';

const listOf = (md: string): List => {
  const list = parseSection(md).find((node): node is List => node.type === 'list');
  if (list === undefined) throw new Error(`no list in ${md}`);
  return list;
};

describe('isLabeledList', () => {
  it.each([
    { md: '- Name: <!-- TEMPLATE-ONLY: string; required -->', expected: true },
    { md: '- Name: <!-- TEMPLATE-ONLY: string; required -->\n- Note: free text', expected: true },
    { md: '- Name: no directive here', expected: false },
    { md: '- plain\n- items', expected: false },
  ])(
    'is true exactly when at least one labeled item carries a directive ($expected)',
    { tags: ['invariant'], meta: { spec: 'is-labeled-list-needs-one-directive' } },
    ({ md, expected }) => {
      expect(isLabeledList(listOf(md))).toBe(expected);
    },
  );
});
