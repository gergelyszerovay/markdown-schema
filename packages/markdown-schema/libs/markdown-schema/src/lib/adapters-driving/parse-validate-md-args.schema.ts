import type { ValidateMdArgs } from './validate-md-args.schema.ts';

/** The options only directory mode takes. */
const directoryOnlyOptions = [
  '--root',
  '--ignore',
  '--template-package',
  '--no-template-packages',
  '--json',
  '--verbose',
];

/**
 * Parses the `validate-md` command line. With `--template <file>` it is the single-template
 * mode: `--emit-json <path>`, `--no-refine` and the documents to validate, or `--emit-schema`
 * alone to print the template's JSON Schema. Without it, it is
 * directory mode: `--root <dir>`, `--ignore <dir-or-path>` (repeatable), `--template-package <key>`
 * (repeatable), `--no-template-packages`, `--no-refine`, `--json`, `--verbose` and the paths to
 * validate, `.` when there are none, except that an empty
 * command line, `--help` and `-h` ask for the usage. The first problem
 * found is the one reported, in argument order, then the checks on the whole line.
 * @param args - The arguments after the program name.
 * @returns The command to run, the request for help, or the usage error to print.
 */
export function parseValidateMdArgs(args: readonly string[]): ValidateMdArgs {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) return { kind: 'help' };

  let templateGiven = false;
  let templatePath: string | undefined;
  let emitJsonPath: string | undefined;
  let emitSchema = false;
  let root: string | undefined;
  const ignore: string[] = [];
  const templatePackages: string[] = [];
  let noTemplatePackages = false;
  let noRefine = false;
  let json = false;
  let verbose = false;
  const usedDirectoryOnly: string[] = [];
  const paths: string[] = [];

  const rest = [...args];
  for (let arg = rest.shift(); arg !== undefined; arg = rest.shift()) {
    if (directoryOnlyOptions.includes(arg)) usedDirectoryOnly.push(arg);
    if (arg === '--template') {
      templateGiven = true;
      templatePath = rest.shift();
      if (templatePath === undefined) {
        return {
          kind: 'usage-error',
          message: 'Error: --template requires a value',
          showUsage: true,
        };
      }
    } else if (arg === '--emit-json') {
      emitJsonPath = rest.shift();
      if (emitJsonPath === undefined) {
        return {
          kind: 'usage-error',
          message: 'Error: --emit-json requires a value',
          showUsage: true,
        };
      }
    } else if (arg === '--root' || arg === '--ignore' || arg === '--template-package') {
      const value = rest.shift();
      if (value === undefined) {
        return { kind: 'usage-error', message: `Error: ${arg} requires a value`, showUsage: true };
      }
      if (arg === '--root') root = value;
      else if (arg === '--ignore') ignore.push(value);
      else templatePackages.push(value);
    } else if (arg === '--no-template-packages') {
      noTemplatePackages = true;
    } else if (arg === '--emit-schema') {
      emitSchema = true;
    } else if (arg === '--no-refine') {
      noRefine = true;
    } else if (arg === '--json') {
      json = true;
    } else if (arg === '--verbose') {
      verbose = true;
    } else if (arg === '--schema' || arg === '--export') {
      return {
        kind: 'usage-error',
        message:
          'Error: --schema/--export were removed in v0.2.0. Use --template <file.template.md> instead.',
        showUsage: false,
      };
    } else if (arg.startsWith('--')) {
      return { kind: 'usage-error', message: `Error: unknown option '${arg}'`, showUsage: true };
    } else {
      paths.push(arg);
    }
  }

  if (!templateGiven) {
    if (emitJsonPath !== undefined) {
      return {
        kind: 'usage-error',
        message: 'Error: --emit-json needs --template <file.template.md>',
        showUsage: true,
      };
    }
    if (emitSchema) {
      return {
        kind: 'usage-error',
        message: 'Error: --emit-schema needs --template <file.template.md>',
        showUsage: true,
      };
    }
    return {
      kind: 'validate-tree',
      paths: paths.length === 0 ? ['.'] : paths,
      root,
      ignore,
      templatePackages,
      noTemplatePackages,
      noRefine,
      json,
      verbose,
    };
  }
  if (!templatePath) {
    return {
      kind: 'usage-error',
      message: 'Error: --template <file.template.md> is required',
      showUsage: true,
    };
  }
  if (usedDirectoryOnly.length > 0) {
    return {
      kind: 'usage-error',
      message: `Error: ${usedDirectoryOnly[0] ?? ''} is only valid without --template`,
      showUsage: true,
    };
  }
  if (emitSchema) {
    if (paths.length > 0 || emitJsonPath !== undefined || noRefine) {
      return {
        kind: 'usage-error',
        message: 'Error: --emit-schema takes only --template <file.template.md>',
        showUsage: true,
      };
    }
    return { kind: 'emit-schema', templatePath };
  }
  if (paths.length === 0) {
    return {
      kind: 'usage-error',
      message: 'Error: at least one markdown file is required',
      showUsage: true,
    };
  }
  if (emitJsonPath !== undefined && paths.length !== 1) {
    return {
      kind: 'usage-error',
      message: 'Error: --emit-json requires exactly one markdown file',
      showUsage: false,
    };
  }
  return { kind: 'validate', templatePath, documentPaths: paths, emitJsonPath, noRefine };
}
