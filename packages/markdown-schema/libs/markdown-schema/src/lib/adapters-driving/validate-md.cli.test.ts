import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EmitTemplateSchemaInput } from '../core/emit-template-schema/emit-template-schema.input.ts';
import type { EmitTemplateSchemaResult } from '../core/emit-template-schema/emit-template-schema.result.ts';
import type { EmitTemplateSchema } from '../core/emit-template-schema/emit-template-schema.use-case.ts';
import type { ValidateDocumentsInput } from '../core/validate-documents/validate-documents.input.ts';
import type { ValidateDocumentsResult } from '../core/validate-documents/validate-documents.result.ts';
import type { ValidateDocuments } from '../core/validate-documents/validate-documents.use-case.ts';
import { formatUsage } from './usage.format.ts';
import { makeValidateMdCommand } from './validate-md.cli.ts';

type Context = {
  run: (args: string[]) => Promise<number>;
  received: ValidateDocumentsInput[];
  schemaRequests: EmitTemplateSchemaInput[];
  printed: string[];
};

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Builds the command over use cases that answer with fixed results, and captures what it
 * prints to stderr.
 * @param result - What the stubbed validate-documents use case returns.
 * @param schemaResult - What the stubbed emit-template-schema use case returns.
 * @returns A runner, the inputs each use case received, and the printed lines.
 */
function setUp(
  result: ValidateDocumentsResult,
  schemaResult: EmitTemplateSchemaResult = { kind: 'emitted', json: '{}' },
): Context {
  const received: ValidateDocumentsInput[] = [];
  const schemaRequests: EmitTemplateSchemaInput[] = [];
  const printed: string[] = [];
  vi.spyOn(console, 'error').mockImplementation((line: string) => {
    printed.push(line);
  });
  const validateDocuments: ValidateDocuments = (input) => {
    received.push(input);
    return Promise.resolve(result);
  };
  const emitTemplateSchema: EmitTemplateSchema = (input) => {
    schemaRequests.push(input);
    return Promise.resolve(schemaResult);
  };
  const validateTree = (): Promise<number> =>
    Promise.reject(new Error('directory mode is not under test here'));
  return {
    run: makeValidateMdCommand({ validateDocuments, emitTemplateSchema, validateTree }),
    received,
    schemaRequests,
    printed,
  };
}

describe('makeValidateMdCommand', () => {
  it(
    'passes the parsed command line to the use case and exits 0 when every document is valid',
    {
      tags: ['scenario'],
      meta: {
        spec: 'validate-md-command-all-valid-exits-0',
        arrange: 'a use case that reports both documents valid, the second with a JSON output',
        act: 'the command runs with a template, --no-refine and two documents',
        assert: 'the use case got that input, the OK lines were printed, and the exit code is 0',
      },
    },
    async () => {
      let context: Context;
      let exitCode: number;
      arrange: {
        context = setUp({
          kind: 'validated',
          documents: [
            { kind: 'valid', path: 'a.md', wrote: undefined },
            { kind: 'valid', path: 'b.md', wrote: undefined },
          ],
        });
      }
      act: {
        exitCode = await context.run([
          '--template',
          't.template.md',
          '--no-refine',
          'a.md',
          'b.md',
        ]);
      }
      assert: {
        expect(context.received).toEqual([
          {
            templatePath: 't.template.md',
            documentPaths: ['a.md', 'b.md'],
            emitJsonPath: undefined,
            noRefine: true,
          },
        ]);
        expect(context.printed).toEqual(['a.md: OK', 'b.md: OK']);
        expect(exitCode).toBe(0);
      }
    },
  );

  it(
    'exits 1 and prints the issues when a document does not validate',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'validate-md-command-invalid-document-exits-1',
        arrange: 'a use case that reports one valid and one schema-invalid document',
        act: 'the command runs with both documents',
        assert: 'every outcome is printed and the exit code is 1',
      },
    },
    async () => {
      let context: Context;
      let exitCode: number;
      arrange: {
        context = setUp({
          kind: 'validated',
          documents: [
            { kind: 'valid', path: 'a.md', wrote: undefined },
            {
              kind: 'schema-invalid',
              path: 'b.md',
              issues: [{ path: 'meta.Name', message: 'nope' }],
            },
          ],
        });
      }
      act: {
        exitCode = await context.run(['--template', 't.template.md', 'a.md', 'b.md']);
      }
      assert: {
        expect(context.printed).toEqual([
          'a.md: OK',
          'b.md: schema validation failed',
          '  - meta.Name: nope',
        ]);
        expect(exitCode).toBe(1);
      }
    },
  );

  it(
    'exits 1 and prints the error when the template cannot be used',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'validate-md-command-unusable-template-exits-1',
        arrange: 'a use case that reports an invalid template',
        act: 'the command runs with that template',
        assert: 'the template error is printed and the exit code is 1',
      },
    },
    async () => {
      let context: Context;
      let exitCode: number;
      arrange: {
        context = setUp({
          kind: 'template-invalid',
          templatePath: 't.template.md',
          message: 'bad directive',
        });
      }
      act: {
        exitCode = await context.run(['--template', 't.template.md', 'a.md']);
      }
      assert: {
        expect(context.printed).toEqual(['Error: invalid template t.template.md: bad directive']);
        expect(exitCode).toBe(1);
      }
    },
  );

  it(
    'prints the usage error without calling the use case, and exits 1',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'validate-md-command-usage-error-exits-1',
        arrange: 'a use case that would report success',
        act: 'the command runs with --emit-json but no template',
        assert:
          'the error and the usage line are printed, the use case was not called, and the exit code is 1',
      },
    },
    async () => {
      let context: Context;
      let exitCode: number;
      arrange: {
        context = setUp({ kind: 'validated', documents: [] });
      }
      act: {
        exitCode = await context.run(['--emit-json', 'o.json', 'a.md']);
      }
      assert: {
        expect(context.printed).toEqual([
          'Error: --emit-json needs --template <file.template.md>',
          formatUsage(),
        ]);
        expect(context.received).toEqual([]);
        expect(exitCode).toBe(1);
      }
    },
  );

  it(
    'prints the emitted JSON Schema to stdout and exits 0 with --emit-schema',
    {
      tags: ['scenario'],
      meta: {
        spec: 'validate-md-command-emit-schema-prints-to-stdout',
        arrange: 'an emit-schema use case that answers with a serialized schema',
        act: 'the command runs with --template and --emit-schema',
        assert: 'the schema goes to stdout, nothing to stderr, and the exit code is 0',
      },
    },
    async () => {
      let context: Context;
      let exitCode: number;
      const logged: string[] = [];
      arrange: {
        context = setUp(
          { kind: 'validated', documents: [] },
          { kind: 'emitted', json: '{\n  "type": "object"\n}' },
        );
        vi.spyOn(console, 'log').mockImplementation((line: string) => {
          logged.push(line);
        });
      }
      act: {
        exitCode = await context.run(['--template', 't.template.md', '--emit-schema']);
      }
      assert: {
        expect(context.schemaRequests).toEqual([{ templatePath: 't.template.md' }]);
        expect(logged).toEqual(['{\n  "type": "object"\n}']);
        expect(context.printed).toEqual([]);
        expect(context.received).toEqual([]);
        expect(exitCode).toBe(0);
      }
    },
  );

  it(
    'exits 1 and prints the template error when --emit-schema cannot compile the template',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'validate-md-command-emit-schema-template-error-exits-1',
        arrange: 'an emit-schema use case that reports an invalid template',
        act: 'the command runs with --template and --emit-schema',
        assert: 'the error names the template, nothing goes to stdout, and the exit code is 1',
      },
    },
    async () => {
      let context: Context;
      let exitCode: number;
      arrange: {
        context = setUp(
          { kind: 'validated', documents: [] },
          { kind: 'template-invalid', templatePath: 't.template.md', message: 'bad directive' },
        );
      }
      act: {
        exitCode = await context.run(['--template', 't.template.md', '--emit-schema']);
      }
      assert: {
        expect(context.printed).toEqual(['t.template.md: bad directive']);
        expect(exitCode).toBe(1);
      }
    },
  );

  it(
    'rejects --emit-schema combined with documents or the other single-template flags',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'validate-md-command-emit-schema-is-exclusive',
        arrange: 'use cases that would report success',
        act: 'the command runs with --emit-schema and a document',
        assert: 'the usage error is printed, no use case was called, and the exit code is 1',
      },
    },
    async () => {
      let context: Context;
      let exitCode: number;
      arrange: {
        context = setUp({ kind: 'validated', documents: [] });
      }
      act: {
        exitCode = await context.run(['--template', 't.template.md', '--emit-schema', 'a.md']);
      }
      assert: {
        expect(context.printed).toEqual([
          'Error: --emit-schema takes only --template <file.template.md>',
          formatUsage(),
        ]);
        expect(context.schemaRequests).toEqual([]);
        expect(context.received).toEqual([]);
        expect(exitCode).toBe(1);
      }
    },
  );

  it(
    'prints the usage to stdout and exits 0 for an empty command line',
    {
      tags: ['scenario'],
      meta: {
        spec: 'validate-md-command-empty-line-shows-help',
        arrange: 'a use case that would report success',
        act: 'the command runs with no arguments',
        assert:
          'the usage is printed to stdout, nothing to stderr, the use case was not called, and the exit code is 0',
      },
    },
    async () => {
      let context: Context;
      let exitCode: number;
      const logged: string[] = [];
      arrange: {
        context = setUp({ kind: 'validated', documents: [] });
        vi.spyOn(console, 'log').mockImplementation((line: string) => {
          logged.push(line);
        });
      }
      act: {
        exitCode = await context.run([]);
      }
      assert: {
        expect(logged).toEqual([formatUsage()]);
        expect(context.printed).toEqual([]);
        expect(context.received).toEqual([]);
        expect(exitCode).toBe(0);
      }
    },
  );
});
