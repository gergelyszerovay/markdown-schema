import { describe, expect, it } from 'vitest';
import { SAMPLE_FILES } from '../../testing/binding-sample.fixture.ts';
import { bindDocuments } from './bind-documents.rules.ts';
import type { BindDocumentsInput } from './bind-documents-input.model.ts';
import type { DocumentBinding } from './document-binding.model.ts';

const bind = (
  files: Readonly<Record<string, string>> | readonly string[] = SAMPLE_FILES,
  options: Partial<BindDocumentsInput> = {},
): DocumentBinding[] =>
  bindDocuments({ paths: Array.isArray(files) ? files : Object.keys(files), ...options }).documents;
const byPath = (
  path: string,
  files?: Readonly<Record<string, string>> | readonly string[],
): DocumentBinding => {
  const binding = bind(files).find((document) => document.path === path);
  if (binding === undefined) throw new Error(`no binding for ${path}`);
  return binding;
};

describe('bindDocuments', () => {
  it(
    'binds a document to the template its name asks for, wherever the document sits',
    { tags: ['invariant'], meta: { spec: 'bind-documents-binds-by-name' } },
    () => {
      expect(byPath('layered-docs/3.thing.spec.md')).toMatchObject({
        status: 'bound',
        templateName: 'spec',
        templatePath: 'markdown-schema-templates/spec/spec.template.md',
        candidates: [],
        hasRefine: true,
        diagnostics: [],
      });
      expect(byPath('packages/foo/libs/checkout/layered-docs/1.checkout.spec.md').status).toBe(
        'bound',
      );
    },
  );

  it(
    'binds an all-upper-case file name to the lower-case template when no template has the upper-case name',
    { tags: ['invariant'], meta: { spec: 'bind-documents-upper-case-names-fall-back' } },
    () => {
      const files = {
        'skills/x/markdown-schema-templates/changelog/changelog.template.md':
          '# <!-- TEMPLATE-ONLY: string -->\n',
        'skills/x/CHANGELOG.md': '# Changelog\n',
        'skills/x/README.md': '# Readme\n',
        'CHANGELOG.md': '# Changelog\n',
      };
      expect(byPath('skills/x/CHANGELOG.md', files)).toMatchObject({
        status: 'bound',
        templateName: 'changelog',
        templatePath: 'skills/x/markdown-schema-templates/changelog/changelog.template.md',
      });
      expect(byPath('skills/x/README.md', files)).toMatchObject({
        status: 'unbound',
        templateName: 'README',
      });
      expect(byPath('CHANGELOG.md', files).status).toBe('unbound');
    },
  );

  it(
    'binds every Markdown file, in or out of a layered-docs tree, and leaves the rest alone',
    { tags: ['invariant'], meta: { spec: 'bind-documents-covers-every-markdown-file' } },
    () => {
      const paths = bind(
        {
          ...SAMPLE_FILES,
          'docs/plan.md': '#',
          'layered-docs/diagram.svg': '<svg/>',
          'layered-docs/fixtures/x.md': '#',
        },
        { ignoredDirNames: ['fixtures'] },
      ).map((document) => document.path);

      expect(paths).toContain('docs/plan.md');
      expect(paths).toContain('README.md');
      expect(paths).not.toContain('layered-docs/diagram.svg');
      expect(paths).not.toContain('layered-docs/fixtures/x.md');
      expect(paths).not.toContain('markdown-schema-templates/spec/spec.refine.ts');
      expect(paths).toEqual([...paths].sort());
    },
  );

  it(
    'leaves a document unbound when no template of its name is in reach',
    { tags: ['invariant'], meta: { spec: 'bind-documents-unbound-without-a-template' } },
    () => {
      expect(byPath('README.md')).toMatchObject({
        status: 'unbound',
        templateName: 'README',
        templatePath: null,
        diagnostics: [],
      });
      expect(byPath('layered-docs/5.notes.workflow.md').status).toBe('unbound');
    },
  );

  it(
    'takes the template name after the level number, from the last segment',
    { tags: ['invariant'], meta: { spec: 'bind-documents-name-is-the-last-segment' } },
    () => {
      const paths = [
        'a/2.billing.constitution.md',
        'a/constitution.md',
        'a/4.index.node-lib.md',
        'a/markdown-schema-templates/constitution/constitution.template.md',
        'a/markdown-schema-templates/node-lib/node-lib.template.md',
      ];

      const documents = bind(paths);

      expect(documents.find((d) => d.path === 'a/2.billing.constitution.md')).toMatchObject({
        status: 'bound',
        templateName: 'constitution',
      });
      expect(documents.find((d) => d.path === 'a/constitution.md')?.status).toBe('bound');
      expect(documents.find((d) => d.path === 'a/4.index.node-lib.md')).toMatchObject({
        status: 'bound',
        templateName: 'node-lib',
      });
    },
  );

  it(
    'searches only an ancestor’s own templates folder, not its subtree',
    {
      tags: ['invariant'],
      meta: { spec: 'bind-documents-searches-only-the-ancestors-own-folder' },
    },
    () => {
      const documents = bind([
        'apps/x/docs/1.thing.spec.md',
        'apps/y/markdown-schema-templates/spec/spec.template.md',
        'apps/x/docs/deeper/markdown-schema-templates/spec/spec.template.md',
      ]);

      expect(documents.find((d) => d.path === 'apps/x/docs/1.thing.spec.md')).toMatchObject({
        status: 'unbound',
        templatePath: null,
      });
    },
  );

  it(
    'lets the closest ancestor with a templates folder that holds the name decide',
    { tags: ['invariant'], meta: { spec: 'bind-documents-the-closest-level-decides' } },
    () => {
      const documents = bind([
        'markdown-schema-templates/spec/spec.template.md',
        'apps/x/markdown-schema-templates/spec/spec.template.md',
        'apps/x/docs/1.thing.spec.md',
        'tools/docs/1.other.spec.md',
        'libs/z/markdown-schema-templates/other/other.template.md',
        'libs/z/docs/1.third.spec.md',
      ]);
      const of = (path: string): DocumentBinding | undefined =>
        documents.find((document) => document.path === path);

      expect(of('apps/x/docs/1.thing.spec.md')?.templatePath).toBe(
        'apps/x/markdown-schema-templates/spec/spec.template.md',
      );
      // tools has no folder, and libs/z has one without a `spec`, so both fall through to the root.
      expect(of('tools/docs/1.other.spec.md')?.templatePath).toBe(
        'markdown-schema-templates/spec/spec.template.md',
      );
      expect(of('libs/z/docs/1.third.spec.md')?.templatePath).toBe(
        'markdown-schema-templates/spec/spec.template.md',
      );
    },
  );

  it(
    'leaves a document unbound when templates of its name sit only in sibling folders',
    { tags: ['edge-case'], meta: { spec: 'bind-documents-sibling-templates-do-not-clash' } },
    () => {
      const documents = bind([
        'apps/a/markdown-schema-templates/spec/spec.template.md',
        'apps/b/markdown-schema-templates/spec/spec.template.md',
        'apps/docs/1.thing.spec.md',
      ]);

      expect(documents.find((d) => d.path === 'apps/docs/1.thing.spec.md')).toMatchObject({
        status: 'unbound',
        candidates: [],
        diagnostics: [],
      });
    },
  );

  it(
    'prefers the canonical folder over a legacy one in the same directory',
    { tags: ['edge-case'], meta: { spec: 'bind-documents-canonical-beats-legacy-at-a-level' } },
    () => {
      const documents = bind([
        'x/markdown-schema-templates/spec/spec.template.md',
        'x/layered-doc-templates/spec/spec.template.md',
        'x/docs/1.thing.spec.md',
      ]);

      expect(documents.find((d) => d.path === 'x/docs/1.thing.spec.md')).toMatchObject({
        status: 'bound',
        templatePath: 'x/markdown-schema-templates/spec/spec.template.md',
      });
    },
  );

  it(
    'reads the legacy folder name when it is the only template',
    { tags: ['edge-case'], meta: { spec: 'bind-documents-reads-the-legacy-folder-name' } },
    () => {
      const documents = bind([
        'x/layered-doc-templates/spec/spec.template.md',
        'x/docs/1.thing.spec.md',
      ]);

      expect(documents.find((d) => d.path === 'x/docs/1.thing.spec.md')?.status).toBe('bound');
    },
  );

  it(
    'marks files of a templates folder as templates, bound to nothing',
    { tags: ['invariant'], meta: { spec: 'bind-documents-template-files-are-templates' } },
    () => {
      const documents = bind({
        ...SAMPLE_FILES,
        'markdown-schema-templates/spec/examples/valid.md': '#',
      });

      expect(
        documents.find((d) => d.path === 'markdown-schema-templates/spec/spec.template.md'),
      ).toMatchObject({ status: 'template', templateName: null, templatePath: null });
      expect(
        documents.find((d) => d.path === 'markdown-schema-templates/spec/examples/valid.md')
          ?.status,
      ).toBe('template');
    },
  );

  it(
    'does not treat a template below an ignored directory, or with a wrong stem, as a template',
    { tags: ['edge-case'], meta: { spec: 'bind-documents-ignores-fixtures-and-wrong-stems' } },
    () => {
      const documents = bind(
        [
          'fixtures/markdown-schema-templates/spec/spec.template.md',
          'markdown-schema-templates/spec/other.template.md',
          'docs/1.thing.spec.md',
        ],
        { ignoredDirNames: ['fixtures'] },
      );

      expect(documents.find((d) => d.path === 'docs/1.thing.spec.md')?.status).toBe('unbound');
    },
  );

  it(
    'binds nothing for a tree without Markdown',
    { tags: ['invariant'], meta: { spec: 'bind-documents-without-markdown-binds-nothing' } },
    () => {
      expect(bindDocuments({ paths: ['src/a.ts'] })).toEqual({ documents: [] });
    },
  );
});
