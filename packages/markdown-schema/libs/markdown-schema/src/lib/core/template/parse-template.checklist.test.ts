import { describe, expect, it } from 'vitest';
import { Ajv2020 } from 'ajv/dist/2020.js';
import { DirectiveError } from '../directive/directive.error.ts';
import { templateJsonSchema } from '../json-schema/template-json-schema.rules.ts';
import { readFixture } from '../../testing/read-fixture.fixture.ts';
import { parseTemplate } from './parse-template.rules.ts';

const template = parseTemplate(readFixture('generate/checklist.template.md'));
const valid = readFixture('generate/checklist-valid.md');

/**
 * Replaces one fragment of the valid checklist document and parses the result.
 * @param from - The fragment to replace.
 * @param to - Its replacement.
 * @returns The parse result; it throws when the document is invalid.
 */
function parseWith(from: string, to: string): unknown {
  expect(valid).toContain(from);
  return template.parse(valid.replace(from, to));
}

describe('checkbox columns', () => {
  it(
    'a checkbox cell reads [ ] and [x] as booleans in the row object',
    { tags: ['invariant'], meta: { spec: 'checkbox-column-reads-cells-as-booleans' } },
    () => {
      const data = template.parse(valid) as { checks: Record<string, unknown>[] };
      expect(data.checks.map((row) => row.Done)).toEqual([true, false]);
    },
  );

  it(
    'a checkbox column is published with its own kind, required and never a key',
    { tags: ['invariant'], meta: { spec: 'checkbox-column-shape-kind' } },
    () => {
      const checks = template.shape.sections.find((s) => s.key === 'checks');
      expect(
        checks?.body.kind === 'table' && checks.body.columns.map((c) => [c.header, c.kind]),
      ).toEqual([
        ['ID', 'text'],
        ['Check', 'text'],
        ['Done', 'checkbox'],
        ['Owner', 'text'],
      ]);
    },
  );

  it(
    'any other cell text is a validation issue',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'checkbox-column-rejects-other-cell-text',
        arrange: 'a checklist whose Done cell holds yes',
        act: 'parse the document',
        assert: 'a validation issue names the checkbox rule',
      },
    },
    () => {
      expect(() => parseWith('| [x] |', '| yes |')).toThrow(/checkbox cell must be/);
      expect(() => parseWith('| [x] |', '|  |')).toThrow(/checkbox cell must be/);
    },
  );

  it(
    'checkbox takes no other modifier',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'checkbox-column-takes-no-other-modifier',
        arrange: 'a row directive declaring a checkbox column with key or a default',
        act: 'parse the template',
        assert: 'a directive error names the contradiction',
      },
    },
    () => {
      const withColumn = (spec: string): string =>
        `# T\n\n## S\n\n| A |\n| - |\n\n<!-- TEMPLATE-ONLY: row\nA: ${spec}\n-->\n`;
      expect(() => parseTemplate(withColumn('checkbox; key'))).toThrow(DirectiveError);
      expect(() => parseTemplate(withColumn('checkbox; default=x'))).toThrow(DirectiveError);
      expect(() => parseTemplate(withColumn('checkbox; optional'))).toThrow(DirectiveError);
      expect(() => parseTemplate(withColumn('checkbox; required'))).not.toThrow();
    },
  );

  it(
    'the JSON Schema types the column boolean and accepts the emitted JSON',
    { tags: ['invariant'], meta: { spec: 'checkbox-column-json-schema-boolean' } },
    () => {
      const schema = templateJsonSchema(template.shape) as {
        properties: {
          checks: { items: { properties: Record<string, unknown>; required: string[] } };
        };
      };
      expect(schema.properties.checks.items.properties.Done).toEqual({ type: 'boolean' });
      expect(schema.properties.checks.items.required).toContain('Done');
    },
  );
});

describe('task-list item rules', () => {
  it(
    'the shape and the JSON Schema carry min-items, max-items and the item regex',
    { tags: ['invariant'], meta: { spec: 'task-list-rules-shape-and-json-schema' } },
    () => {
      const steps = template.shape.sections.find((s) => s.key === 'steps');
      expect(steps?.body).toEqual({
        kind: 'task-list',
        minItems: 1,
        maxItems: 5,
        pattern: '^[A-Z]',
      });
      const schema = templateJsonSchema(template.shape) as {
        properties: { steps: Record<string, unknown> };
      };
      expect(schema.properties.steps).toMatchObject({
        type: 'array',
        minItems: 1,
        maxItems: 5,
        items: { properties: { text: { type: 'string', pattern: '^[A-Z]' } } },
      });
      const validate = new Ajv2020().compile(schema);
      const data = JSON.parse(JSON.stringify(template.parse(valid))) as Record<string, unknown>;
      expect(validate(data)).toBe(true);
      expect(validate({ ...data, steps: [] })).toBe(false);
      expect(validate({ ...data, steps: [{ checked: false, text: 'lower' }] })).toBe(false);
    },
  );

  it(
    'a document outside the bounds or the regex is a validation issue',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'task-list-rules-reject-documents-outside-the-rules',
        arrange: 'a checklist whose Steps break the minimum, the maximum or the item regex',
        act: 'parse the document',
        assert: 'each throws a validation issue',
      },
    },
    () => {
      const steps = '- [x] Build it\n- [ ] Ship it';
      expect(() => parseWith(steps, '- [ ] lower case')).toThrow(/does not match|Invalid string/i);
      const six = Array.from({ length: 6 }, (_, i) => `- [ ] Step ${String(i)}`).join('\n');
      expect(() => parseWith(steps, six)).toThrow(/at most 5|<=5|too_big/i);
      expect(() => parseWith(steps, '- [ ] Step one')).not.toThrow();
    },
  );

  it(
    'min-items, max-items and regex on a section that is not a task list are template errors',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'task-list-rules-only-on-task-lists',
        arrange: 'a plain-list section declaring min-items',
        act: 'parse the template',
        assert: 'a directive error says the rules apply to task-list sections only',
      },
    },
    () => {
      const plain = '# T\n\n## S\n\n<!-- TEMPLATE-ONLY: section; min-items: 1 -->\n\n- item\n';
      expect(() => parseTemplate(plain)).toThrow(/task-list sections only/);
    },
  );
});
