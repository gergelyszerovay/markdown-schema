import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { parseTemplate } from './parse-template.rules.ts';
import type { RefineFunction } from '../refine-function.model.ts';

const templateRaw = [
  '# <!-- TEMPLATE-ONLY: string; required -->',
  '',
  '## 1. Summary',
  '',
  '<!-- TEMPLATE-ONLY: freetext; required -->',
].join('\n');

describe('parseTemplate — frontmatter extraction', () => {
  const schema = parseTemplate(templateRaw);

  it(
    'exposes parsed YAML frontmatter on doc.frontmatter',
    {
      tags: ['invariant'],
      meta: { spec: 'frontmatter-exposes-parsed-yaml-frontmatter-on-doc-frontmatter' },
    },
    () => {
      const raw = [
        '---',
        'name: Heritage',
        'colors:',
        "  primary: '#1A1C1E'",
        "  neutral: '#F7F5F2'",
        '---',
        '# Heritage',
        '',
        '## 1. Summary',
        '',
        'Body.',
        '',
      ].join('\n');
      const doc = schema.parse(raw);
      expect(doc.frontmatter).toEqual({
        name: 'Heritage',
        colors: { primary: '#1A1C1E', neutral: '#F7F5F2' },
      });
      expect(doc.title).toBe('Heritage');
    },
  );

  it(
    'leaves frontmatter absent when no YAML block is present',
    {
      tags: ['invariant'],
      meta: { spec: 'frontmatter-leaves-frontmatter-absent-when-no-yaml-block-is-present' },
    },
    () => {
      const raw = '# Heritage\n\n## 1. Summary\n\nBody.\n';
      const doc = schema.parse(raw);
      expect(doc.frontmatter).toBeUndefined();
    },
  );

  it(
    'normalizes an empty frontmatter block to an empty object',
    {
      tags: ['invariant'],
      meta: { spec: 'frontmatter-normalizes-an-empty-frontmatter-block-to-an-empty-object' },
    },
    () => {
      const raw = '---\n---\n# Heritage\n\n## 1. Summary\n\nBody.\n';
      const doc = schema.parse(raw);
      expect(doc.frontmatter).toEqual({});
    },
  );

  it(
    'does not treat YAML body inside the fence as a markdown section',
    {
      tags: ['invariant'],
      meta: { spec: 'frontmatter-does-not-treat-yaml-body-inside-the-fence-as-a-markdown-section' },
    },
    () => {
      const raw = [
        '---',
        'name: Heritage',
        '---',
        '# Heritage',
        '',
        '## 1. Summary',
        '',
        'Body.',
        '',
      ].join('\n');
      const doc = schema.parse(raw);
      const summary = doc.summary ?? '';
      expect(summary).toContain('Body.');
    },
  );
});

describe('parseTemplate — frontmatter visible to refine', () => {
  const refine: RefineFunction = (doc, ctx: z.core.$RefinementCtx) => {
    const d = doc as { frontmatter?: { colors?: Record<string, string> } };
    if (!d.frontmatter?.colors?.primary) {
      ctx.addIssue({
        code: 'custom',
        path: ['frontmatter', 'colors', 'primary'],
        message: 'primary color is required',
      });
    }
  };
  const schema = parseTemplate(templateRaw, { refine });

  it(
    "passes when refine's frontmatter rule is satisfied",
    {
      tags: ['invariant'],
      meta: { spec: 'frontmatter-passes-when-refine-s-frontmatter-rule-is-satisfied' },
    },
    () => {
      const raw = [
        '---',
        'colors:',
        "  primary: '#000'",
        '---',
        '# X',
        '',
        '## 1. Summary',
        '',
        'Body.',
        '',
      ].join('\n');
      expect(() => schema.parse(raw)).not.toThrow();
    },
  );

  it(
    "fails when refine's frontmatter rule is violated",
    {
      tags: ['invariant'],
      meta: { spec: 'frontmatter-fails-when-refine-s-frontmatter-rule-is-violated' },
    },
    () => {
      const raw = '# X\n\n## 1. Summary\n\nBody.\n';
      expect(() => schema.parse(raw)).toThrow(/primary color is required/);
    },
  );
});
