import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { parseTemplate } from './parse-template.rules.ts';
import { loadExampleRefine, readExample, readFixture } from '../../testing/read-fixture.fixture.ts';

const fixtureTemplate = (name: string): string => readFixture(`templates/${name}`);

const fixture = (name: string): string => readFixture(`component-spec/${name}`);

const ComponentDoc = parseTemplate(readExample('component/component.template.md'), {
  refine: await loadExampleRefine('component/component'),
});

// ---------------------------------------------------------------------------
// Component template — valid paths
// ---------------------------------------------------------------------------

describe('Component template — valid docs', () => {
  it.each(['valid-minimal.md', 'valid-full.md', 'valid-primitive.md'])(
    '%s parses without errors',
    { tags: ['invariant'], meta: { spec: 'component-template-validate-parses-without-errors' } },
    (file) => {
      expect(() => ComponentDoc.parse(fixture(file))).not.toThrow();
    },
  );
});

// ---------------------------------------------------------------------------
// Component template — invalid paths
// ---------------------------------------------------------------------------

describe('Component template — invalid docs', () => {
  it(
    'bad title → ZodError with title must match message',
    {
      tags: ['invariant'],
      meta: {
        spec: 'component-template-validate-bad-title-zoderror-with-title-must-match-message',
      },
    },
    () => {
      let threw: unknown;
      try {
        ComponentDoc.parse(fixture('invalid-bad-title.md'));
      } catch (e) {
        threw = e;
      }
      expect(threw).toBeInstanceOf(ZodError);
      expect((threw as ZodError).issues.map((i) => i.message).join('\n')).toContain(
        'title must match',
      );
    },
  );

  it(
    "missing summary → Error with 'Missing required section'",
    {
      tags: ['invariant'],
      meta: {
        spec: 'component-template-validate-missing-summary-error-with-missing-required-section',
      },
    },
    () => {
      let threw: unknown;
      try {
        ComponentDoc.parse(fixture('invalid-missing-summary.md'));
      } catch (e) {
        threw = e;
      }
      expect(threw).toBeInstanceOf(Error);
      expect(threw).not.toBeInstanceOf(ZodError);
      expect((threw as Error).message).toContain('Missing required section');
    },
  );

  it(
    'view with internal state → ZodError from remove-if',
    {
      tags: ['invariant'],
      meta: {
        spec: 'component-template-validate-view-with-internal-state-zoderror-from-remove-if',
      },
    },
    () => {
      let threw: unknown;
      try {
        ComponentDoc.parse(fixture('invalid-view-with-internal-state.md'));
      } catch (e) {
        threw = e;
      }
      expect(threw).toBeInstanceOf(ZodError);
      expect((threw as ZodError).issues.map((i) => i.message).join('\n')).toContain(
        'must be removed when Type=View',
      );
    },
  );

  it(
    'undeclared event → ZodError from refine',
    {
      tags: ['invariant'],
      meta: { spec: 'component-template-validate-undeclared-event-zoderror-from-refine' },
    },
    () => {
      let threw: unknown;
      try {
        ComponentDoc.parse(fixture('invalid-event-not-declared.md'));
      } catch (e) {
        threw = e;
      }
      expect(threw).toBeInstanceOf(ZodError);
      expect((threw as ZodError).issues.map((i) => i.message).join('\n')).toContain('onToggle');
    },
  );
});

// ---------------------------------------------------------------------------
// Fixture templates
// ---------------------------------------------------------------------------

describe('enum-only template', () => {
  const schema = parseTemplate(fixtureTemplate('enum-only.template.md'));

  it(
    'accepts valid enum choice',
    {
      tags: ['invariant'],
      meta: { spec: 'component-template-validate-accepts-valid-enum-choice' },
    },
    () => {
      expect(() =>
        schema.parse('# Status Report\n\n## 1. Status\n\n- Level: High\n'),
      ).not.toThrow();
    },
  );

  it(
    'rejects invalid enum choice',
    {
      tags: ['invariant'],
      meta: { spec: 'component-template-validate-rejects-invalid-enum-choice' },
    },
    () => {
      let threw: unknown;
      try {
        schema.parse('# Status Report\n\n## 1. Status\n\n- Level: Extreme\n');
      } catch (e) {
        threw = e;
      }
      expect(threw).toBeInstanceOf(ZodError);
      expect((threw as ZodError).issues.map((i) => i.message).join('\n')).toContain(
        'Invalid option',
      );
    },
  );
});

describe('table-row template', () => {
  const schema = parseTemplate(fixtureTemplate('table-row.template.md'));

  it(
    'accepts valid table',
    { tags: ['invariant'], meta: { spec: 'component-template-validate-accepts-valid-table' } },
    () => {
      const raw = [
        '# Feature Spec',
        '',
        '## 1. Acceptance Criteria',
        '',
        '| ID | Description | Priority |',
        '| -- | ----------- | -------- |',
        '| AC-001 | First criterion. | High |',
      ].join('\n');
      expect(() => schema.parse(raw)).not.toThrow();
    },
  );

  it(
    'rejects bad ID format',
    { tags: ['invariant'], meta: { spec: 'component-template-validate-rejects-bad-id-format' } },
    () => {
      const raw = [
        '# Feature Spec',
        '',
        '## 1. Acceptance Criteria',
        '',
        '| ID | Description | Priority |',
        '| -- | ----------- | -------- |',
        '| 001 | Bad ID. | High |',
      ].join('\n');
      let threw: unknown;
      try {
        schema.parse(raw);
      } catch (e) {
        threw = e;
      }
      expect(threw).toBeInstanceOf(ZodError);
      expect((threw as ZodError).issues.map((i) => i.message).join('\n')).toContain('AC-');
    },
  );
});

describe('section-optional template', () => {
  const schema = parseTemplate(fixtureTemplate('section-optional.template.md'));

  it(
    'accepts doc without optional section',
    {
      tags: ['invariant'],
      meta: { spec: 'component-template-validate-accepts-doc-without-optional-section' },
    },
    () => {
      const raw = '# Document\n\n## 1. Summary\n\nShort description.\n';
      const doc = schema.parse(raw);
      expect(doc.notes).toBeUndefined();
    },
  );

  it(
    'accepts doc with optional section',
    {
      tags: ['invariant'],
      meta: { spec: 'component-template-validate-accepts-doc-with-optional-section' },
    },
    () => {
      const raw = [
        '# Document',
        '',
        '## 1. Summary',
        '',
        'Short description.',
        '',
        '## 2. Notes',
        '',
        '| Key | Value |',
        '| --- | ----- |',
        '| foo | bar |',
      ].join('\n');
      const doc = schema.parse(raw);
      expect(Array.isArray(doc.notes)).toBe(true);
    },
  );
});
