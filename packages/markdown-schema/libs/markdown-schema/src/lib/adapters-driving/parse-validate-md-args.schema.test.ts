import { describe, expect, it } from 'vitest';
import { parseValidateMdArgs } from './parse-validate-md-args.schema.ts';

describe('parseValidateMdArgs', () => {
  it.each([
    {
      args: ['--template', 't.template.md', 'a.md'],
      expected: {
        templatePath: 't.template.md',
        documentPaths: ['a.md'],
        emitJsonPath: undefined,
        noRefine: false,
      },
    },
    {
      args: ['a.md', '--no-refine', '--template', 't.template.md', 'b.md'],
      expected: {
        templatePath: 't.template.md',
        documentPaths: ['a.md', 'b.md'],
        emitJsonPath: undefined,
        noRefine: true,
      },
    },
    {
      args: ['--emit-json', 'out.json', '--template', 't.template.md', 'a.md'],
      expected: {
        templatePath: 't.template.md',
        documentPaths: ['a.md'],
        emitJsonPath: 'out.json',
        noRefine: false,
      },
    },
    {
      args: ['--template', '--no-refine', 'a.md'],
      expected: {
        templatePath: '--no-refine',
        documentPaths: ['a.md'],
        emitJsonPath: undefined,
        noRefine: false,
      },
    },
    {
      args: ['--template', 't.template.md', '-x', 'a.md'],
      expected: {
        templatePath: 't.template.md',
        documentPaths: ['-x', 'a.md'],
        emitJsonPath: undefined,
        noRefine: false,
      },
    },
  ])(
    'takes each flag’s value as the next argument whatever it looks like, and everything else as a document ($args)',
    { tags: ['invariant'], meta: { spec: 'validate-md-args-parse-a-command' } },
    ({ args, expected }) => {
      expect(parseValidateMdArgs(args)).toEqual({ kind: 'validate', ...expected });
    },
  );

  it.each([
    { args: ['--template'], message: 'Error: --template requires a value', showUsage: true },
    { args: ['--emit-json'], message: 'Error: --emit-json requires a value', showUsage: true },
    {
      args: ['--schema', 'x', 'a.md'],
      message:
        'Error: --schema/--export were removed in v0.2.0. Use --template <file.template.md> instead.',
      showUsage: false,
    },
    {
      args: ['--export', 'a.md'],
      message:
        'Error: --schema/--export were removed in v0.2.0. Use --template <file.template.md> instead.',
      showUsage: false,
    },
    {
      args: ['--template', 't.template.md', '--no-refin', 'a.md'],
      message: "Error: unknown option '--no-refin'",
      showUsage: true,
    },
    {
      args: ['--emit-json', 'o.json', 'a.md'],
      message: 'Error: --emit-json needs --template <file.template.md>',
      showUsage: true,
    },
    { args: ['--root'], message: 'Error: --root requires a value', showUsage: true },
    { args: ['--ignore'], message: 'Error: --ignore requires a value', showUsage: true },
    {
      args: ['--template', 't.template.md', '--json', 'a.md'],
      message: 'Error: --json is only valid without --template',
      showUsage: true,
    },
    {
      args: ['--template', '', 'a.md'],
      message: 'Error: --template <file.template.md> is required',
      showUsage: true,
    },
    {
      args: ['--template', 't.template.md'],
      message: 'Error: at least one markdown file is required',
      showUsage: true,
    },
    {
      args: ['--template', 't.template.md', '--emit-json', 'o.json', 'a.md', 'b.md'],
      message: 'Error: --emit-json requires exactly one markdown file',
      showUsage: false,
    },
  ])(
    'reports the first problem of the command line, with the usage line only when it helps ($message)',
    { tags: ['invariant'], meta: { spec: 'validate-md-args-usage-errors' } },
    ({ args, message, showUsage }) => {
      expect(parseValidateMdArgs(args)).toEqual({ kind: 'usage-error', message, showUsage });
    },
  );

  it.each([
    {
      args: ['--verbose'],
      expected: {
        paths: ['.'],
        root: undefined,
        ignore: [],
        noRefine: false,
        json: false,
        verbose: true,
      },
    },
    {
      args: ['a.md', 'docs', '--no-refine', '--json', '--verbose'],
      expected: {
        paths: ['a.md', 'docs'],
        root: undefined,
        ignore: [],
        noRefine: true,
        json: true,
        verbose: true,
      },
    },
    {
      args: ['--root', '/repo', '--ignore', 'vendor', '--ignore', 'a/b', 'docs'],
      expected: {
        paths: ['docs'],
        root: '/repo',
        ignore: ['vendor', 'a/b'],
        noRefine: false,
        json: false,
        verbose: false,
      },
    },
  ])(
    'reads directory mode when there is no --template, defaulting to the current directory ($args)',
    { tags: ['invariant'], meta: { spec: 'validate-md-args-parse-directory-mode' } },
    ({ args, expected }) => {
      expect(parseValidateMdArgs(args)).toEqual({ kind: 'validate-tree', ...expected });
    },
  );

  it.each([[[]], [['--help']], [['-h']], [['--template', 't.template.md', '-h']]])(
    'asks for the usage on an empty command line, --help or -h ($0)',
    { tags: ['invariant'], meta: { spec: 'validate-md-args-help' } },
    (args) => {
      expect(parseValidateMdArgs(args)).toEqual({ kind: 'help' });
    },
  );
});
