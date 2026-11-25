import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { makeRefineLoaderFake } from '../../testing/refine-loader.fake.ts';
import { makeTextFilesFake } from '../../testing/text-files.fake.ts';
import type { ValidateDocumentsResult } from './validate-documents.result.ts';
import { makeValidateDocuments } from './validate-documents.use-case.ts';

const template = [
  '# Doc: <!-- TEMPLATE-ONLY: string; required -->',
  '',
  '## 1. Meta',
  '',
  '- Name: <!-- TEMPLATE-ONLY: string; required -->',
  '',
].join('\n');
const valid = '# Doc: Widget\n\n## 1. Meta\n\n- Name: Good\n';
const rejectedByRefine = '# Doc: Widget\n\n## 1. Meta\n\n- Name: BAD\n';

const rejectBad = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const name = (doc as { meta?: { Name?: string } }).meta?.Name;
  if (name === 'BAD')
    ctx.addIssue({ code: 'custom', path: ['meta', 'Name'], message: 'Name must not be BAD' });
};

/**
 * Builds the use case over in-memory files and a refine loader that knows one companion.
 * @param files - The files that exist, by path.
 * @returns The use case and the fakes behind it.
 */
function setUp(files: Record<string, string>): {
  validate: ReturnType<typeof makeValidateDocuments>;
  textFiles: ReturnType<typeof makeTextFilesFake>;
  refines: ReturnType<typeof makeRefineLoaderFake>;
} {
  const textFiles = makeTextFilesFake(files);
  const refines = makeRefineLoaderFake();
  refines.givenRefine('t.template.md', rejectBad);
  return {
    validate: makeValidateDocuments({ textFiles, loadRefine: refines.loadRefine }),
    textFiles,
    refines,
  };
}

describe('makeValidateDocuments', () => {
  it(
    'reports every document that satisfies the template as valid',
    {
      tags: ['scenario'],
      meta: {
        spec: 'validate-documents-valid-documents',
        arrange: 'a template and two documents that satisfy it',
        act: 'both documents are validated',
        assert: 'each has a valid outcome, in the order given, and nothing was written',
      },
    },
    async () => {
      let context: ReturnType<typeof setUp>;
      let result: ValidateDocumentsResult;
      arrange: {
        context = setUp({ 't.template.md': template, 'a.md': valid, 'b.md': valid });
      }
      act: {
        result = await context.validate({
          templatePath: 't.template.md',
          documentPaths: ['a.md', 'b.md'],
          emitJsonPath: undefined,
          noRefine: false,
        });
      }
      assert: {
        expect(result).toEqual({
          kind: 'validated',
          documents: [
            { kind: 'valid', path: 'a.md', wrote: undefined },
            { kind: 'valid', path: 'b.md', wrote: undefined },
          ],
        });
      }
    },
  );

  it(
    'writes the parsed document as JSON when asked to emit it',
    {
      tags: ['scenario'],
      meta: {
        spec: 'validate-documents-emits-json',
        arrange: 'a template and a document that satisfies it',
        act: 'the document is validated with an output path for its JSON',
        assert:
          'the outcome names the path, and the file holds the parsed document, two-space indented, with a final newline',
      },
    },
    async () => {
      let context: ReturnType<typeof setUp>;
      let result: ValidateDocumentsResult;
      arrange: {
        context = setUp({ 't.template.md': template, 'a.md': valid });
      }
      act: {
        result = await context.validate({
          templatePath: 't.template.md',
          documentPaths: ['a.md'],
          emitJsonPath: 'out/a.json',
          noRefine: false,
        });
      }
      assert: {
        expect(result).toEqual({
          kind: 'validated',
          documents: [{ kind: 'valid', path: 'a.md', wrote: 'out/a.json' }],
        });
        expect(context.textFiles.files.get('out/a.json')).toBe(
          JSON.stringify({ title: 'Doc: Widget', meta: { Name: 'Good' } }, null, 2) + '\n',
        );
      }
    },
  );

  it(
    'does not ask for the refine companion when told to skip it',
    {
      tags: ['scenario'],
      meta: {
        spec: 'validate-documents-no-refine-skips-the-companion',
        arrange: 'a template whose companion rejects the name BAD, and a document named BAD',
        act: 'the document is validated with noRefine set',
        assert: 'the document is valid and the refine loader was never called',
      },
    },
    async () => {
      let context: ReturnType<typeof setUp>;
      let result: ValidateDocumentsResult;
      arrange: {
        context = setUp({ 't.template.md': template, 'bad.md': rejectedByRefine });
      }
      act: {
        result = await context.validate({
          templatePath: 't.template.md',
          documentPaths: ['bad.md'],
          emitJsonPath: undefined,
          noRefine: true,
        });
      }
      assert: {
        expect(result).toEqual({
          kind: 'validated',
          documents: [{ kind: 'valid', path: 'bad.md', wrote: undefined }],
        });
        expect(context.refines.calls).toEqual([]);
      }
    },
  );

  it(
    'reports a document the refine rejects with the issue and its path',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'validate-documents-refine-rejection',
        arrange: 'a template whose companion rejects the name BAD, and a document named BAD',
        act: 'the document is validated',
        assert:
          'the outcome is schema-invalid with one issue at meta.Name carrying the refine message',
      },
    },
    async () => {
      let context: ReturnType<typeof setUp>;
      let result: ValidateDocumentsResult;
      arrange: {
        context = setUp({ 't.template.md': template, 'bad.md': rejectedByRefine });
      }
      act: {
        result = await context.validate({
          templatePath: 't.template.md',
          documentPaths: ['bad.md'],
          emitJsonPath: undefined,
          noRefine: false,
        });
      }
      assert: {
        expect(result).toEqual({
          kind: 'validated',
          documents: [
            {
              kind: 'schema-invalid',
              path: 'bad.md',
              issues: [{ path: 'meta.Name', message: 'Name must not be BAD' }],
            },
          ],
        });
      }
    },
  );

  it(
    'reports a structural failure as a failed document, not a schema violation',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'validate-documents-structural-failure',
        arrange: 'a template and a document without the required Meta section',
        act: 'the document is validated',
        assert: 'the outcome is failed with the parser’s message',
      },
    },
    async () => {
      let context: ReturnType<typeof setUp>;
      let result: ValidateDocumentsResult;
      arrange: {
        context = setUp({ 't.template.md': template, 'empty.md': '# Doc: Widget\n' });
      }
      act: {
        result = await context.validate({
          templatePath: 't.template.md',
          documentPaths: ['empty.md'],
          emitJsonPath: undefined,
          noRefine: true,
        });
      }
      assert: {
        expect(result).toEqual({
          kind: 'validated',
          documents: [
            { kind: 'failed', path: 'empty.md', message: 'Missing required section: "1. Meta"' },
          ],
        });
      }
    },
  );

  it(
    'carries on with the next document when one cannot be read',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'validate-documents-unreadable-document-does-not-stop-the-run',
        arrange: 'a template, a missing document listed first, and a valid one after it',
        act: 'both are validated',
        assert: 'the first is failed with the read error and the second is valid',
      },
    },
    async () => {
      let context: ReturnType<typeof setUp>;
      let result: ValidateDocumentsResult;
      arrange: {
        context = setUp({ 't.template.md': template, 'ok.md': valid });
      }
      act: {
        result = await context.validate({
          templatePath: 't.template.md',
          documentPaths: ['missing.md', 'ok.md'],
          emitJsonPath: undefined,
          noRefine: true,
        });
      }
      assert: {
        expect(result).toEqual({
          kind: 'validated',
          documents: [
            {
              kind: 'failed',
              path: 'missing.md',
              message: "ENOENT: no such file or directory, open 'missing.md'",
            },
            { kind: 'valid', path: 'ok.md', wrote: undefined },
          ],
        });
      }
    },
  );

  it(
    'reports a document whose JSON output cannot be written as failed',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'validate-documents-unwritable-output-fails-the-document',
        arrange: 'a template, a valid document, and an output path that cannot be written',
        act: 'the document is validated with that output path',
        assert: 'the outcome is failed with the write error',
      },
    },
    async () => {
      let context: ReturnType<typeof setUp>;
      let result: ValidateDocumentsResult;
      arrange: {
        context = setUp({ 't.template.md': template, 'a.md': valid });
        context.textFiles.unwritable.add('locked.json');
      }
      act: {
        result = await context.validate({
          templatePath: 't.template.md',
          documentPaths: ['a.md'],
          emitJsonPath: 'locked.json',
          noRefine: true,
        });
      }
      assert: {
        expect(result).toEqual({
          kind: 'validated',
          documents: [
            {
              kind: 'failed',
              path: 'a.md',
              message: "EACCES: permission denied, open 'locked.json'",
            },
          ],
        });
      }
    },
  );

  it(
    'ends the run when the template cannot be read',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'validate-documents-unreadable-template',
        arrange: 'no template file',
        act: 'a document is validated against it',
        assert: 'the result is template-unreadable with the read error, and no document was read',
      },
    },
    async () => {
      let context: ReturnType<typeof setUp>;
      let result: ValidateDocumentsResult;
      arrange: {
        context = setUp({ 'a.md': valid });
      }
      act: {
        result = await context.validate({
          templatePath: 'gone.template.md',
          documentPaths: ['a.md'],
          emitJsonPath: undefined,
          noRefine: false,
        });
      }
      assert: {
        expect(result).toEqual({
          kind: 'template-unreadable',
          message: "ENOENT: no such file or directory, open 'gone.template.md'",
        });
        expect(context.refines.calls).toEqual([]);
      }
    },
  );

  it(
    'ends the run when the template is invalid, naming the template as given',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'validate-documents-invalid-template',
        arrange: 'a template with an unknown directive keyword',
        act: 'a document is validated against it',
        assert:
          'the result is template-invalid with the template path as given and the directive error',
      },
    },
    async () => {
      let context: ReturnType<typeof setUp>;
      let result: ValidateDocumentsResult;
      arrange: {
        context = setUp({
          'bad.template.md': '# T <!-- TEMPLATE-ONLY: bogus -->\n',
          'a.md': valid,
        });
      }
      act: {
        result = await context.validate({
          templatePath: 'bad.template.md',
          documentPaths: ['a.md'],
          emitJsonPath: undefined,
          noRefine: true,
        });
      }
      assert: {
        expect(result).toEqual({
          kind: 'template-invalid',
          templatePath: 'bad.template.md',
          message: "unknown TEMPLATE-ONLY directive kind: 'bogus'",
        });
      }
    },
  );
});
