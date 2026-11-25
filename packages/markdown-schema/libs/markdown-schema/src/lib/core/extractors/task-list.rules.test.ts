import { describe, it, expect } from 'vitest';
import { taskList } from './task-list.rules.ts';
import { parseSection } from '../../testing/parse-section.fixture.ts';

describe('taskList', () => {
  it(
    'extracts checked and unchecked items',
    { tags: ['invariant'], meta: { spec: 'task-list-extracts-checked-and-unchecked-items' } },
    () => {
      const nodes = parseSection('- [x] Done\n- [ ] Pending');
      expect(taskList(nodes, { section: 'S' })).toEqual([
        { checked: true, text: 'Done' },
        { checked: false, text: 'Pending' },
      ]);
    },
  );

  it(
    'yields the url for a link item',
    { tags: ['invariant'], meta: { spec: 'task-list-yields-the-url-for-a-link-item' } },
    () => {
      const nodes = parseSection(
        '- [x] [4.foo.feature.md](../3.features/4.foo.feature.md)\n- [ ] `@pkg#Sym`',
      );
      expect(taskList(nodes, { section: 'S' })).toEqual([
        { checked: true, text: '../3.features/4.foo.feature.md' },
        { checked: false, text: '@pkg#Sym' },
      ]);
    },
  );

  it(
    'throws when no list is present',
    { tags: ['invariant'], meta: { spec: 'task-list-throws-when-no-list-is-present' } },
    () => {
      const nodes = parseSection('No list.');
      expect(() => taskList(nodes, { section: 'Tasks' })).toThrow(
        `Section "Tasks" must contain a list`,
      );
    },
  );
});
