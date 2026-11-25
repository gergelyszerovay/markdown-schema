import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ValidateTreeInput } from '../core/validate-tree/validate-tree.input.ts';
import type { ValidateTreeResult } from '../core/validate-tree/validate-tree.result.ts';
import { makeValidateTreeCommand } from './validate-tree.cli.ts';

type Context = {
  run: (json?: boolean) => Promise<number>;
  received: ValidateTreeInput[];
  printed: string[];
  logged: string[];
};

afterEach(() => {
  vi.restoreAllMocks();
});

const summary = { documents: 1, ok: 1, failed: 0, ambiguous: 0, unbound: 2, templateErrors: 0 };
const okResult: ValidateTreeResult = {
  kind: 'validated',
  root: '/repo',
  documents: [
    {
      path: 'a.md',
      templatePath: 't/t.template.md',
      outcome: { kind: 'valid', path: 'a.md', wrote: undefined },
    },
  ],
  ambiguous: [],
  unbound: ['x.md', 'y.md'],
  templateErrors: [],
  unreadTemplateLinks: [],
  summary,
};

/**
 * Builds the command over a use case that answers with a fixed result, and captures what it
 * prints to stderr and stdout.
 * @param result - What the stubbed use case returns.
 * @returns A runner, the inputs the use case received, and the printed lines.
 */
function setUp(result: ValidateTreeResult): Context {
  const received: ValidateTreeInput[] = [];
  const printed: string[] = [];
  const logged: string[] = [];
  vi.spyOn(console, 'error').mockImplementation((line: string) => {
    printed.push(line);
  });
  vi.spyOn(console, 'log').mockImplementation((line: string) => {
    logged.push(line);
  });
  const command = makeValidateTreeCommand({
    validateTree: (input) => {
      received.push(input);
      return Promise.resolve(result);
    },
  });
  return {
    run: (json = false) =>
      command({
        kind: 'validate-tree',
        paths: ['docs'],
        root: '/repo',
        ignore: ['vendor'],
        noRefine: true,
        json,
        verbose: false,
      }),
    received,
    printed,
    logged,
  };
}

describe('makeValidateTreeCommand', () => {
  it(
    'passes the command line to the use case, prints the lines and the summary, and exits 0 when all is well',
    {
      tags: ['scenario'],
      meta: {
        spec: 'validate-tree-command-all-valid-exits-0',
        arrange: 'a use case that reports one valid document and two unbound files',
        act: 'the command runs with a path, a root, an ignore and --no-refine',
        assert:
          'the use case got that input, the OK line and the summary were printed, and the exit code is 0',
      },
    },
    async () => {
      let context: Context;
      let exitCode: number;
      arrange: {
        context = setUp(okResult);
      }
      act: {
        exitCode = await context.run();
      }
      assert: {
        expect(context.received).toEqual([
          { root: '/repo', paths: ['docs'], ignore: ['vendor'], noRefine: true },
        ]);
        expect(context.printed).toEqual([
          'a.md: OK',
          '1 documents: 1 OK, 0 failed; 0 ambiguous; 2 unbound',
        ]);
        expect(exitCode).toBe(0);
      }
    },
  );

  it.each([
    { what: 'a failed document', patch: { summary: { ...summary, ok: 0, failed: 1 } } },
    { what: 'an ambiguous file', patch: { summary: { ...summary, ambiguous: 1 } } },
    { what: 'a template error', patch: { summary: { ...summary, templateErrors: 1 } } },
  ])(
    'exits 1 for $what',
    { tags: ['edge-case'], meta: { spec: 'validate-tree-command-problems-exit-1' } },
    async ({ patch }) => {
      const context = setUp({ ...okResult, ...patch });
      expect(await context.run()).toBe(1);
    },
  );

  it(
    'prints a refusal and exits 1',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'validate-tree-command-refusal-exits-1',
        arrange: 'a use case that refuses the paths',
        act: 'the command runs',
        assert: 'the message is printed and the exit code is 1',
      },
    },
    async () => {
      let context: Context;
      let exitCode: number;
      arrange: {
        context = setUp({ kind: 'refused', message: 'Error: x is outside the root /repo' });
      }
      act: {
        exitCode = await context.run();
      }
      assert: {
        expect(context.printed).toEqual(['Error: x is outside the root /repo']);
        expect(exitCode).toBe(1);
      }
    },
  );

  it(
    'prints the whole result as JSON to stdout with --json',
    {
      tags: ['scenario'],
      meta: {
        spec: 'validate-tree-command-json-prints-the-result',
        arrange: 'a use case that reports one valid document',
        act: 'the command runs with --json',
        assert: 'stdout holds the result as JSON, nothing goes to stderr, and the exit code is 0',
      },
    },
    async () => {
      let context: Context;
      let exitCode: number;
      arrange: {
        context = setUp(okResult);
      }
      act: {
        exitCode = await context.run(true);
      }
      assert: {
        expect(JSON.parse(context.logged.join('\n'))).toEqual(JSON.parse(JSON.stringify(okResult)));
        expect(context.printed).toEqual([]);
        expect(exitCode).toBe(0);
      }
    },
  );
});
