import {
  loadRefine,
  makeEmitTemplateSchema,
  makeNodeDirectory,
  makeNodeTemplatePackages,
  makeNodeTextFiles,
  makeValidateDocuments,
  makeValidateMdCommand,
  makeValidateTree,
  makeValidateTreeCommand,
} from '#libs/markdown-schema';
import type { ValidateMdCommand } from '#libs/markdown-schema';

/**
 * Wires the `validate-md` command to the file system: text files are read and written through
 * Node's `fs`, directories and the template folders of the packages a root lists are listed
 * through it, and a template's `refine` companion is imported from disk.
 * @returns The command, ready to run with the arguments after the program name.
 */
export function createValidateMd(): ValidateMdCommand {
  const textFiles = makeNodeTextFiles();
  const validateDocuments = makeValidateDocuments({ textFiles, loadRefine });
  const emitTemplateSchema = makeEmitTemplateSchema({ textFiles });
  const validateTree = makeValidateTreeCommand({
    validateTree: makeValidateTree({
      directory: makeNodeDirectory(),
      templatePackages: makeNodeTemplatePackages(),
      textFiles,
      loadRefine,
    }),
  });
  return makeValidateMdCommand({ validateDocuments, emitTemplateSchema, validateTree });
}
