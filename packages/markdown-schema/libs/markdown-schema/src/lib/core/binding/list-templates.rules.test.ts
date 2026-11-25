import { describe, expect, it } from 'vitest';
import { listTemplates } from './list-templates.rules.ts';

describe('listTemplates', () => {
  it(
    'lists every template of a templates folder, canonical or legacy, with what sits beside it',
    { tags: ['invariant'], meta: { spec: 'list-templates-lists-canonical-and-legacy-folders' } },
    () => {
      const { templates } = listTemplates({
        paths: [
          'skills/a/markdown-schema-templates/alpha/alpha.template.md',
          'skills/a/markdown-schema-templates/alpha/alpha.refine.ts',
          'skills/a/markdown-schema-templates/alpha/examples/x.md',
          'apps/b/layered-doc-templates/beta/beta.template.md',
        ],
      });

      expect(templates).toEqual([
        {
          name: 'beta',
          path: 'apps/b/layered-doc-templates/beta/beta.template.md',
          folder: 'apps/b/layered-doc-templates',
          parent: 'apps/b',
          legacy: true,
          hasRefine: false,
        },
        {
          name: 'alpha',
          path: 'skills/a/markdown-schema-templates/alpha/alpha.template.md',
          folder: 'skills/a/markdown-schema-templates',
          parent: 'skills/a',
          legacy: false,
          hasRefine: true,
        },
      ]);
    },
  );

  it(
    'does not list a folder whose file stem is not its name, and says so',
    { tags: ['edge-case'], meta: { spec: 'list-templates-wrong-stem-is-not-a-template' } },
    () => {
      const result = listTemplates({
        paths: ['markdown-schema-templates/alpha/other.template.md'],
      });

      expect(result.templates).toEqual([]);
      expect(result.diagnostics).toEqual([
        expect.objectContaining({ code: 'template-name-mismatch' }),
      ]);
    },
  );

  it(
    'skips templates below an ignored directory and template files outside a templates folder',
    { tags: ['edge-case'], meta: { spec: 'list-templates-skips-fixtures-and-stray-files' } },
    () => {
      const result = listTemplates({
        paths: [
          'tests/fixtures/markdown-schema-templates/alpha/alpha.template.md',
          'notes/alpha/alpha.template.md',
          'vendor/markdown-schema-templates/beta/beta.template.md',
        ],
        ignoredDirNames: ['fixtures', 'vendor'],
      });

      expect(result.templates).toEqual([]);
    },
  );

  it(
    'reports a name carried by more than one template as a clash',
    { tags: ['invariant'], meta: { spec: 'list-templates-reports-name-clashes' } },
    () => {
      const result = listTemplates({
        paths: [
          'a/markdown-schema-templates/spec/spec.template.md',
          'b/markdown-schema-templates/spec/spec.template.md',
          'a/markdown-schema-templates/plan/plan.template.md',
        ],
      });

      expect(result.clashes).toEqual([
        {
          name: 'spec',
          paths: [
            'a/markdown-schema-templates/spec/spec.template.md',
            'b/markdown-schema-templates/spec/spec.template.md',
          ],
        },
      ]);
      expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
        'template-name-shared',
      ]);
    },
  );
});
