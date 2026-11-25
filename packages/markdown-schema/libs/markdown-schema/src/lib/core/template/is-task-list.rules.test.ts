import { describe, expect, it } from 'vitest';
import type { List } from 'mdast';
import { parseSection } from '../../testing/parse-section.fixture.ts';
import { isTaskList } from './is-task-list.rules.ts';

const listOf = (md: string): List => {
  const list = parseSection(md).find((node): node is List => node.type === 'list');
  if (list === undefined) throw new Error(`no list in ${md}`);
  return list;
};

describe('isTaskList', () => {
  it.each([
    { md: '- [x] done\n- [ ] pending', expected: true },
    { md: '- plain\n- [ ] one task', expected: true },
    { md: '- plain\n- items', expected: false },
  ])(
    'is true exactly when at least one item has a checkbox ($expected)',
    { tags: ['invariant'], meta: { spec: 'is-task-list-needs-one-checkbox' } },
    ({ md, expected }) => {
      expect(isTaskList(listOf(md))).toBe(expected);
    },
  );
});
