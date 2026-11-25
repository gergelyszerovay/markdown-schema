import { describe, expect, it } from 'vitest';
import { makeDirectoryFake } from '../../testing/directory.fake.ts';
import type { DirectoryFake } from '../../testing/directory.fake.ts';
import { makeRefineLoaderFake } from '../../testing/refine-loader.fake.ts';
import type { RefineLoaderFake } from '../../testing/refine-loader.fake.ts';
import { makeTextFilesFake } from '../../testing/text-files.fake.ts';
import type { ValidateTreeInput } from './validate-tree.input.ts';
import type { ValidateTreeResult } from './validate-tree.result.ts';
import { makeValidateTree } from './validate-tree.use-case.ts';

const template = [
  '# Note: <!-- TEMPLATE-ONLY: string; required -->',
  '',
  '## 1. Meta',
  '',
  '- Name: <!-- TEMPLATE-ONLY: string; required -->',
  '',
].join('\n');
const valid = '# Note: Widget\n\n## 1. Meta\n\n- Name: Good\n';
const invalid = '# Note: Widget\n';
const templatePath = 'markdown-schema-templates/note/note.template.md';

const defaultInput: ValidateTreeInput = {
  root: undefined,
  paths: ['.'],
  ignore: [],
  noRefine: false,
};

type Context = {
  validate: (input?: Partial<ValidateTreeInput>) => Promise<ValidateTreeResult>;
  directory: DirectoryFake;
  refines: RefineLoaderFake;
  reads: string[];
};

/**
 * Builds the use case over an in-memory tree.
 * @param files - The files that exist, by root-relative path.
 * @param unreadable - Files that are listed but cannot be read.
 * @returns The runner and the fakes behind it.
 */
function setUp(files: Record<string, string>, unreadable: readonly string[] = []): Context {
  const directory = makeDirectoryFake([...Object.keys(files), ...unreadable]);
  const textFiles = makeTextFilesFake(
    Object.fromEntries(Object.entries(files).map(([path, text]) => [`/virtual/${path}`, text])),
  );
  const reads: string[] = [];
  const read = textFiles.read.bind(textFiles);
  textFiles.read = (path: string): Promise<string> => {
    reads.push(path);
    return read(path);
  };
  const refines = makeRefineLoaderFake();
  const run = makeValidateTree({
    directory: directory.directory,
    textFiles,
    loadRefine: refines.loadRefine,
  });
  return {
    validate: (input = {}) => run({ ...defaultInput, ...input }),
    directory,
    refines,
    reads,
  };
}

/**
 * Narrows a result to a completed run.
 * @param result - What the use case returned.
 * @returns The validated result.
 */
function validated(result: ValidateTreeResult): Extract<ValidateTreeResult, { kind: 'validated' }> {
  if (result.kind !== 'validated') throw new Error(`the run ended: ${result.message}`);
  return result;
}

describe('makeValidateTree', () => {
  it(
    'validates every bound document, and counts the unbound apart',
    {
      tags: ['scenario'],
      meta: {
        spec: 'validate-tree-validates-bound-documents',
        arrange:
          'a template, a valid and an invalid document named for it, and a file no template claims',
        act: 'the tree is validated',
        assert:
          'the valid one is OK, the invalid one failed, the loose file is unbound, and the summary says so',
      },
    },
    async () => {
      let context: Context;
      let result: Extract<ValidateTreeResult, { kind: 'validated' }>;
      arrange: {
        context = setUp({
          [templatePath]: template,
          'docs/good.note.md': valid,
          'docs/bad.note.md': invalid,
          'docs/README.md': '# Readme\n',
        });
      }
      act: {
        result = validated(await context.validate());
      }
      assert: {
        expect(result.documents.map((document) => [document.path, document.outcome.kind])).toEqual([
          ['docs/bad.note.md', 'failed'],
          ['docs/good.note.md', 'valid'],
        ]);
        expect(result.ambiguous).toEqual([]);
        expect(result.unbound).toEqual(['docs/README.md']);
        expect(result.summary).toEqual({
          documents: 2,
          ok: 1,
          failed: 1,
          ambiguous: 0,
          unbound: 1,
          templateErrors: 0,
        });
      }
    },
  );

  it(
    'compiles each template once however many documents are bound to it',
    {
      tags: ['invariant'],
      meta: {
        spec: 'validate-tree-reads-each-template-once',
        arrange: 'a template and three documents bound to it',
        act: 'the tree is validated',
        assert: 'the template was read once and its refine companion asked for once',
      },
    },
    async () => {
      let context: Context;
      arrange: {
        context = setUp({
          [templatePath]: template,
          'a.note.md': valid,
          'b.note.md': valid,
          'c.note.md': valid,
        });
      }
      act: {
        validated(await context.validate());
      }
      assert: {
        expect(context.reads.filter((path) => path.endsWith('note.template.md'))).toHaveLength(1);
        expect(context.refines.calls).toEqual([`/virtual/${templatePath}`]);
      }
    },
  );

  it(
    'does not ask for the refine companions when told to skip them',
    {
      tags: ['scenario'],
      meta: {
        spec: 'validate-tree-no-refine-skips-companions',
        arrange: 'a template and a document bound to it',
        act: 'the tree is validated with noRefine set',
        assert: 'the refine loader was never called',
      },
    },
    async () => {
      let context: Context;
      arrange: {
        context = setUp({ [templatePath]: template, 'a.note.md': valid });
      }
      act: {
        validated(await context.validate({ noRefine: true }));
      }
      assert: {
        expect(context.refines.calls).toEqual([]);
      }
    },
  );

  it(
    'reports a template that does not compile once, and its documents as not validated',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'validate-tree-broken-template-is-reported-once',
        arrange: 'a template with an unknown directive keyword and two documents bound to it',
        act: 'the tree is validated',
        assert:
          'one template error with the directive message, both documents not validated, and both counted as failed',
      },
    },
    async () => {
      let context: Context;
      let result: Extract<ValidateTreeResult, { kind: 'validated' }>;
      arrange: {
        context = setUp({
          [templatePath]: '# T <!-- TEMPLATE-ONLY: bogus -->\n',
          'a.note.md': valid,
          'b.note.md': valid,
        });
      }
      act: {
        result = validated(await context.validate());
      }
      assert: {
        expect(result.templateErrors).toEqual([
          { templatePath, message: "unknown TEMPLATE-ONLY directive kind: 'bogus'" },
        ]);
        expect(result.documents.map((document) => document.outcome.kind)).toEqual([
          'not-validated',
          'not-validated',
        ]);
        expect(result.summary).toMatchObject({ documents: 2, ok: 0, failed: 2, templateErrors: 1 });
      }
    },
  );

  it(
    'validates the files of a template’s own examples folder against that template',
    {
      tags: ['scenario'],
      meta: {
        spec: 'validate-tree-validates-template-examples',
        arrange:
          'a template with a valid and an invalid example, and a file in its folder that is no example',
        act: 'the tree is validated',
        assert: 'each example is validated against the template, and the other file is not',
      },
    },
    async () => {
      let context: Context;
      let result: Extract<ValidateTreeResult, { kind: 'validated' }>;
      arrange: {
        context = setUp({
          [templatePath]: template,
          'markdown-schema-templates/note/examples/valid-one.md': valid,
          'markdown-schema-templates/note/examples/invalid-one.md': invalid,
          'markdown-schema-templates/note/notes.md': '# Loose\n',
        });
      }
      act: {
        result = validated(await context.validate());
      }
      assert: {
        expect(result.documents.map((document) => [document.path, document.outcome.kind])).toEqual([
          ['markdown-schema-templates/note/examples/invalid-one.md', 'failed'],
          ['markdown-schema-templates/note/examples/valid-one.md', 'valid'],
        ]);
        expect(result.unbound).toEqual([]);
      }
    },
  );

  it(
    'validates only the documents under the given paths, binding to templates in the folders above them',
    {
      tags: ['scenario'],
      meta: {
        spec: 'validate-tree-scopes-documents-to-paths',
        arrange: 'a template at the root, and documents in three directories',
        act: 'one directory and one file elsewhere are validated',
        assert: 'only those documents are reported, each bound to the template outside its path',
      },
    },
    async () => {
      let context: Context;
      let result: Extract<ValidateTreeResult, { kind: 'validated' }>;
      arrange: {
        context = setUp({
          [templatePath]: template,
          'a/one.note.md': valid,
          'b/two.note.md': valid,
          'c/three.note.md': valid,
        });
      }
      act: {
        result = validated(await context.validate({ paths: ['a', 'c/three.note.md'] }));
      }
      assert: {
        expect(result.documents.map((document) => document.path)).toEqual([
          'a/one.note.md',
          'c/three.note.md',
        ]);
        expect(result.documents.every((document) => document.templatePath === templatePath)).toBe(
          true,
        );
        expect(context.directory.scopeCalls.map((call) => call.paths)).toEqual([
          ['a', 'c/three.note.md'],
        ]);
        expect(context.directory.scopeCalls[0]?.templateFolders).toEqual([
          'markdown-schema-templates',
          'layered-doc-templates',
          'c/markdown-schema-templates',
          'c/layered-doc-templates',
        ]);
      }
    },
  );

  it(
    'skips version control, dependencies, build output and what --ignore names',
    {
      tags: ['scenario'],
      meta: {
        spec: 'validate-tree-skips-ignored-directories',
        arrange:
          'documents under node_modules, dist and vendor, one under a path to ignore, and one that counts',
        act: 'the tree is validated ignoring vendor and a path',
        assert: 'only the one that counts is reported, and the listing was told what to skip',
      },
    },
    async () => {
      let context: Context;
      let result: Extract<ValidateTreeResult, { kind: 'validated' }>;
      arrange: {
        context = setUp({
          [templatePath]: template,
          'node_modules/x/a.note.md': valid,
          'dist/a.note.md': valid,
          'pkg/vendor/a.note.md': valid,
          'generated/out/a.note.md': valid,
          'generated/keep.note.md': valid,
        });
      }
      act: {
        result = validated(await context.validate({ ignore: ['vendor', 'generated/out/'] }));
      }
      assert: {
        expect(result.documents.map((document) => document.path)).toEqual([
          'generated/keep.note.md',
        ]);
        expect(context.directory.scopeCalls.map((call) => call.skipDirNames)).toEqual([
          ['.git', 'node_modules', 'dist', 'vendor'],
        ]);
      }
    },
  );

  it(
    'ends the run when the directory port refuses the paths',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'validate-tree-refused-path-ends-the-run',
        arrange: 'a tree',
        act: 'a path outside the root is validated',
        assert: 'the result is refused with the port’s message, and nothing was read',
      },
    },
    async () => {
      let context: Context;
      let result: ValidateTreeResult;
      arrange: {
        context = setUp({ [templatePath]: template });
      }
      act: {
        result = await context.validate({ paths: ['../outside'] });
      }
      assert: {
        expect(result).toEqual({
          kind: 'refused',
          message: 'Error: ../outside is outside the root',
        });
        expect(context.reads).toEqual([]);
      }
    },
  );

  it(
    'reports a document that cannot be read as failed and carries on',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'validate-tree-unreadable-document-does-not-stop-the-run',
        arrange: 'a template, a listed document that cannot be read and a valid one',
        act: 'the tree is validated',
        assert: 'the first is failed with the read error and the second is valid',
      },
    },
    async () => {
      let context: Context;
      let result: Extract<ValidateTreeResult, { kind: 'validated' }>;
      arrange: {
        context = setUp({ [templatePath]: template, 'b.note.md': valid }, ['a.note.md']);
      }
      act: {
        result = validated(await context.validate());
      }
      assert: {
        expect(result.documents.map((document) => [document.path, document.outcome.kind])).toEqual([
          ['a.note.md', 'failed'],
          ['b.note.md', 'valid'],
        ]);
      }
    },
  );
});
