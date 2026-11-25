import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { parseTemplate } from './parse-template.rules.ts';
import { loadExampleRefine, readExample, readFixture } from '../../testing/read-fixture.fixture.ts';

const ComponentDoc = parseTemplate(readExample('component/component.template.md'), {
  refine: await loadExampleRefine('component/component'),
});

const fixture = (name: string): string => readFixture(`component-spec/${name}`);

const example = (name: string): string => readExample(`component/${name}`);

// ---------------------------------------------------------------------------
// Valid fixtures
// ---------------------------------------------------------------------------

type ValidAssertion = {
  title: string;
  classificationType: string;
  inputsLength: number;
  visualStatesLength: number;
  hasSlots?: boolean;
  hasInternalState?: boolean;
  sourceValue?: string;
};

const validTable: [string, ValidAssertion][] = [
  [
    'valid-minimal.md',
    {
      title: 'Component Spec: Badge',
      classificationType: 'View',
      inputsLength: 1,
      visualStatesLength: 1,
    },
  ],
  [
    'valid-full.md',
    {
      title: 'Component Spec: Button',
      classificationType: 'View',
      inputsLength: 4,
      visualStatesLength: 5,
      hasSlots: true,
    },
  ],
  [
    'valid-primitive.md',
    {
      title: 'Component Spec: Input',
      classificationType: 'Primitive',
      inputsLength: 2,
      visualStatesLength: 2,
      sourceValue: 'shadcn',
    },
  ],
];

describe('ComponentDoc — valid fixtures', () => {
  it.each(validTable)(
    '%s parses successfully',
    { tags: ['invariant'], meta: { spec: 'component-template-parses-successfully' } },
    (file, assertions) => {
      const doc = ComponentDoc.parse(fixture(file));

      expect(doc.title).toBe(assertions.title);
      const classification = doc.classification as Record<string, string | undefined>;
      expect(classification.Type).toBe(assertions.classificationType);
      expect((doc.inputs as unknown[]).length).toBe(assertions.inputsLength);
      expect((doc.visualStates as unknown[]).length).toBe(assertions.visualStatesLength);

      if (assertions.hasSlots) {
        expect(doc.slots).toBeDefined();
        expect(Array.isArray(doc.slots)).toBe(true);
      } else {
        expect(doc.slots).toBeUndefined();
      }

      if (assertions.hasInternalState) {
        expect(doc.internalState).toBeDefined();
        expect(Array.isArray(doc.internalState)).toBe(true);
      }

      if (assertions.sourceValue !== undefined) {
        expect(classification.Source).toBe(assertions.sourceValue);
      }
    },
  );
});

// ---------------------------------------------------------------------------
// Invalid fixtures
// ---------------------------------------------------------------------------

type InvalidAssertion =
  { kind: 'Error'; messageFragment: string } | { kind: 'ZodError'; messageFragment: string };

const invalidTable: [string, InvalidAssertion][] = [
  ['invalid-bad-title.md', { kind: 'ZodError', messageFragment: 'title must match' }],
  ['invalid-missing-summary.md', { kind: 'Error', messageFragment: 'Missing required section' }],
  ['invalid-missing-props-table.md', { kind: 'Error', messageFragment: 'must contain a table' }],
  ['invalid-bad-classification-type.md', { kind: 'ZodError', messageFragment: 'Invalid option' }],
  [
    'invalid-view-with-internal-state.md',
    {
      kind: 'ZodError',
      messageFragment: 'must be removed when Type=View',
    },
  ],
  ['invalid-event-not-declared.md', { kind: 'ZodError', messageFragment: 'onToggle' }],
  [
    'invalid-source-on-non-primitive.md',
    {
      kind: 'ZodError',
      messageFragment: 'Source is only allowed when Type=Primitive',
    },
  ],
  ['invalid-empty-visual-states.md', { kind: 'ZodError', messageFragment: 'Too small' }],
  ['invalid-bad-required-flag.md', { kind: 'ZodError', messageFragment: 'Invalid option' }],
];

describe('ComponentDoc — invalid fixtures', () => {
  it.each(invalidTable)(
    '%s throws expected error',
    { tags: ['invariant'], meta: { spec: 'component-template-throws-expected-error' } },
    (file, assertion) => {
      let threw: unknown;
      try {
        ComponentDoc.parse(fixture(file));
      } catch (e) {
        threw = e;
      }

      expect(threw).toBeDefined();

      if (assertion.kind === 'ZodError') {
        expect(threw).toBeInstanceOf(ZodError);
        const allMessages = (threw as ZodError).issues.map((i) => i.message).join('\n');
        expect(allMessages).toContain(assertion.messageFragment);
      } else {
        expect(threw).toBeInstanceOf(Error);
        expect(threw).not.toBeInstanceOf(ZodError);
        expect((threw as Error).message).toContain(assertion.messageFragment);
      }
    },
  );
});

// ---------------------------------------------------------------------------
// Snapshot — published example
// ---------------------------------------------------------------------------

describe('ComponentDoc — example.md snapshot', () => {
  it(
    'parses examples/component/example.md and matches snapshot',
    {
      tags: ['invariant'],
      meta: {
        spec: 'component-template-parses-examples-component-example-md-and-matches-snapshot',
      },
    },
    () => {
      const doc = ComponentDoc.parse(example('example.md'));
      expect(doc).toMatchSnapshot();
    },
  );
});
