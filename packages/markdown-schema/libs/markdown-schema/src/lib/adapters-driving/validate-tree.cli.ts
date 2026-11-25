import type { ValidateTree } from '../core/validate-tree/validate-tree.use-case.ts';
import type { ValidateTreeArgs } from './validate-md-args.schema.ts';
import { formatValidateTreeResult } from './validate-tree-result.format.ts';

/** Runs `validate-md` in directory mode and resolves with the process exit code. */
export type ValidateTreeCommand = (args: ValidateTreeArgs) => Promise<number>;

/**
 * Creates the directory-mode command: validates every bound document under the paths and
 * prints the outcome to stderr, or the whole result as JSON to stdout with `--json`. Exit
 * code 0 means everything bound validates and nothing is ambiguous; 1 means a refused root or
 * path, an unreadable tree, a failed document, an ambiguous file or a template that did not
 * compile.
 * @param app - The use case the command calls: `validateTree` validates the tree.
 * @returns The command.
 */
export function makeValidateTreeCommand(app: { validateTree: ValidateTree }): ValidateTreeCommand {
  return async (args) => {
    const result = await app.validateTree({
      root: args.root,
      paths: args.paths,
      ignore: args.ignore,
      noRefine: args.noRefine,
    });
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else {
      for (const line of formatValidateTreeResult(result, { verbose: args.verbose })) {
        console.error(line);
      }
    }
    if (result.kind !== 'validated') {
      if (args.json) console.error(result.message);
      return 1;
    }
    const { summary } = result;
    return summary.failed === 0 && summary.ambiguous === 0 && summary.templateErrors === 0 ? 0 : 1;
  };
}
