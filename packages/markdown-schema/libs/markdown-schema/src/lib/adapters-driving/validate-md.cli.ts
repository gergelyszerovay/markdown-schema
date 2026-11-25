import type { EmitTemplateSchema } from '../core/emit-template-schema/emit-template-schema.use-case.ts';
import type { ValidateDocuments } from '../core/validate-documents/validate-documents.use-case.ts';
import { parseValidateMdArgs } from './parse-validate-md-args.schema.ts';
import type { ValidateTreeArgs } from './validate-md-args.schema.ts';
import { formatUsage } from './usage.format.ts';
import { formatValidateDocumentsResult } from './validate-documents-result.format.ts';

/** Runs the `validate-md` command line and resolves with the process exit code. */
export type ValidateMdCommand = (args: readonly string[]) => Promise<number>;

/**
 * Creates the `validate-md` command: parses the command line and runs one of its modes.
 * With `--template` it validates the given documents against that template and prints the
 * outcome to stderr — or, with `--emit-schema`, prints the template's JSON Schema to
 * stdout; an empty command line, `--help` and `-h` print the usage to stdout and exit 0; exit code 0 means every document is valid (or the schema was emitted), 1 a usage error, an unusable
 * template, or at least one document that did not validate. Without it, it validates every
 * bound document under the given paths, through the directory-mode command it is given. The
 * command never exits the process itself.
 * @param app - What the command runs: `validateDocuments` validates the documents against one
 *   template, `emitTemplateSchema` prints a template's JSON Schema, and `validateTree` is
 *   the directory-mode command (`makeValidateTreeCommand`).
 * @returns The command.
 */
export function makeValidateMdCommand(app: {
  validateDocuments: ValidateDocuments;
  emitTemplateSchema: EmitTemplateSchema;
  validateTree: (args: ValidateTreeArgs) => Promise<number>;
}): ValidateMdCommand {
  return async (args) => {
    const parsed = parseValidateMdArgs(args);
    if (parsed.kind === 'help') {
      console.log(formatUsage());
      return 0;
    }
    if (parsed.kind === 'usage-error') {
      if (parsed.message !== undefined) console.error(parsed.message);
      if (parsed.showUsage) console.error(formatUsage());
      return 1;
    }
    if (parsed.kind === 'validate-tree') return app.validateTree(parsed);
    if (parsed.kind === 'emit-schema') {
      const result = await app.emitTemplateSchema({ templatePath: parsed.templatePath });
      if (result.kind === 'emitted') {
        // The schema is the command's output, so it goes to stdout.
        console.log(result.json);
        return 0;
      }
      const prefix = result.kind === 'template-invalid' ? `${result.templatePath}: ` : '';
      console.error(`${prefix}${result.message}`);
      return 1;
    }
    const result = await app.validateDocuments({
      templatePath: parsed.templatePath,
      documentPaths: parsed.documentPaths,
      emitJsonPath: parsed.emitJsonPath,
      noRefine: parsed.noRefine,
    });
    for (const line of formatValidateDocumentsResult(result)) console.error(line);
    const valid =
      result.kind === 'validated' && result.documents.every((outcome) => outcome.kind === 'valid');
    return valid ? 0 : 1;
  };
}
