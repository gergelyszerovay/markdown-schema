import { describe, expect, it } from 'vitest';
import { Ajv2020 } from 'ajv/dist/2020.js';
import { parseTemplate } from '../template/parse-template.rules.ts';
import { readExample, readFixture } from '../../testing/read-fixture.fixture.ts';
import { templateJsonSchema } from './template-json-schema.rules.ts';

/** The fixture templates the round-trip law runs against, each with one valid document. */
const fixtures: { name: string; template: string; valid: string }[] = [
  {
    name: 'all-features',
    template: readExample('all-features/all-features.template.md'),
    valid: readExample('all-features/all-features.md'),
  },
  {
    name: 'component',
    template: readExample('component/component.template.md'),
    valid: readExample('component/example.md'),
  },
  {
    name: 'release-notes',
    template: readExample(
      'release-notes/markdown-schema-templates/release-notes/release-notes.template.md',
    ),
    valid: readExample('release-notes/release-notes.md'),
  },
  {
    name: 'region',
    template: readFixture('json-schema/region.template.md'),
    valid: readFixture('json-schema/region-valid.md'),
  },
  {
    name: 'checklist',
    template: readFixture('generate/checklist.template.md'),
    valid: readFixture('generate/checklist-valid.md'),
  },
  {
    name: 'constitution',
    template: readFixture('json-schema/constitution.template.md'),
    valid: readFixture('json-schema/constitution-valid.md'),
  },
];

/**
 * Compiles a fixture's JSON Schema with ajv and parses its valid document the way
 * `--emit-json` serializes it (dropping `undefined` values).
 * @param fixture - The fixture to prepare.
 * @returns The ajv validator and the emitted document data.
 */
function prepare(fixture: (typeof fixtures)[number]): {
  validate: ReturnType<Ajv2020['compile']>;
  data: Record<string, unknown>;
} {
  const parsed = parseTemplate(fixture.template);
  const schema = templateJsonSchema(parsed.shape);
  const validate = new Ajv2020().compile(schema);
  const data = JSON.parse(JSON.stringify(parsed.parse(fixture.valid))) as Record<string, unknown>;
  return { validate, data };
}

describe('templateJsonSchema', () => {
  it(
    'the generated schema accepts the emitted JSON of a valid document, for every fixture template',
    { tags: ['invariant'], meta: { spec: 'template-json-schema-accepts-emitted-json' } },
    () => {
      for (const fixture of fixtures) {
        const { validate, data } = prepare(fixture);
        const ok = validate(data);
        expect(ok, `${fixture.name}: ${JSON.stringify(validate.errors, null, 2)}`).toBe(true);
      }
    },
  );

  it(
    'the generated schema rejects a missing required section, an unknown column and a broken key',
    { tags: ['invariant'], meta: { spec: 'template-json-schema-rejects-structural-breaks' } },
    () => {
      for (const name of ['region', 'constitution']) {
        const fixture = fixtures.find((f) => f.name === name);
        if (!fixture) throw new Error(`fixture ${name} not found`);
        const { validate, data } = prepare(fixture);
        const requiredTable = name === 'region' ? 'rules' : 'requirements';

        const missingSection = Object.fromEntries(
          Object.entries(data).filter(([key]) => key !== requiredTable),
        );
        expect(validate(missingSection), `${name}: missing ${requiredTable}`).toBe(false);

        const rows = data[requiredTable] as Record<string, string>[];
        const unknownColumn = {
          ...data,
          [requiredTable]: [{ ...rows[0], Extra: 'x' }, ...rows.slice(1)],
        };
        expect(validate(unknownColumn), `${name}: unknown column`).toBe(false);

        const brokenKey = {
          ...data,
          [requiredTable]: [{ ...rows[0], ID: 'X0' }, ...rows.slice(1)],
        };
        expect(validate(brokenKey), `${name}: broken key`).toBe(false);
      }
    },
  );

  it(
    'a summary-declaring template requires its summary in the schema',
    { tags: ['invariant'], meta: { spec: 'template-json-schema-requires-declared-summary' } },
    () => {
      const parsed = parseTemplate(readFixture('json-schema/region.template.md'));
      const schema = templateJsonSchema(parsed.shape);
      expect(schema.required).toContain('summary');
      const properties = schema.properties as Record<string, Record<string, unknown>>;
      expect(properties.summary).toMatchObject({ type: 'string', pattern: '^[^\\n]{10,200}$' });
    },
  );

  it(
    'a named template carries title, $id and a description, and each section a description; ajv still compiles every schema strictly',
    { tags: ['invariant'], meta: { spec: 'template-json-schema-carries-identity' } },
    () => {
      for (const fixture of fixtures) {
        const parsed = parseTemplate(fixture.template);
        const schema = templateJsonSchema(parsed.shape, { name: fixture.name });
        expect(schema).toMatchObject({
          title: fixture.name,
          $id: `urn:markdown-schema:template:${fixture.name}`,
        });
        expect(typeof schema.description).toBe('string');
        const properties = schema.properties as Record<string, Record<string, unknown>>;
        for (const section of parsed.shape.sections) {
          expect(properties[section.key]?.description, `${fixture.name}: ${section.key}`).toContain(
            `"${section.heading}"`,
          );
        }
        const validate = new Ajv2020({ strict: true }).compile(schema);
        const data = JSON.parse(JSON.stringify(parsed.parse(fixture.valid))) as unknown;
        expect(validate(data), `${fixture.name}: ${JSON.stringify(validate.errors)}`).toBe(true);
      }
    },
  );

  it(
    'an unnamed template has no title or $id',
    { tags: ['edge-case'], meta: { spec: 'template-json-schema-unnamed-has-no-identity' } },
    () => {
      const schema = templateJsonSchema(parseTemplate(fixtures[0]?.template ?? '').shape);
      expect(schema).not.toHaveProperty('$id');
      expect(schema).not.toHaveProperty('title');
    },
  );
});
