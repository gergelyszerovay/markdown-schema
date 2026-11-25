import { errorMessage } from '../error-message.rules.ts';
import { outcomeOfError } from '../document-failure.rules.ts';
import type { DocumentOutcome } from '../document-outcome.model.ts';
import type { RefineLoader } from '../refine-loader.port.ts';
import type { TextFiles } from '../text-files.port.ts';
import { parseTemplate } from '../template/parse-template.rules.ts';
import type { ValidateDocumentsInput } from './validate-documents.input.ts';
import type { ValidateDocumentsResult } from './validate-documents.result.ts';

/** Validates documents against a template and reports one outcome per document. */
export type ValidateDocuments = (input: ValidateDocumentsInput) => Promise<ValidateDocumentsResult>;

/**
 * Creates the use case behind `validate-md`: reads the template, loads its `refine` companion
 * unless told not to, builds the schema, then validates each document and, when asked, writes
 * the parsed document as JSON.
 * @param deps - The ports the use case reads and writes through: `textFiles` reads the
 *   template and the documents and writes the JSON output, and `loadRefine` finds the
 *   template's `refine` companion.
 * @returns The use case.
 * @failure An unreadable or invalid template ends the run with `template-unreadable` or
 * `template-invalid`. A document that cannot be read, fails the schema, or whose JSON output
 * cannot be written gets its own `failed` or `schema-invalid` outcome and the run continues
 * with the next document. A `refine` companion that fails to load rejects, unchanged.
 */
export function makeValidateDocuments({
  textFiles,
  loadRefine,
}: {
  textFiles: TextFiles;
  loadRefine: RefineLoader;
}): ValidateDocuments {
  const validateOne = async (
    schema: { parse(raw: string): unknown },
    path: string,
    emitJsonPath: string | undefined,
  ): Promise<DocumentOutcome> => {
    let raw: string;
    try {
      raw = await textFiles.read(path);
    } catch (error) {
      return { kind: 'failed', path, message: errorMessage(error) };
    }
    try {
      const doc = schema.parse(raw);
      if (emitJsonPath !== undefined) {
        await textFiles.write(emitJsonPath, JSON.stringify(doc, null, 2) + '\n');
      }
      return { kind: 'valid', path, wrote: emitJsonPath };
    } catch (error) {
      return outcomeOfError(path, error);
    }
  };

  return async (input) => {
    let templateRaw: string;
    try {
      templateRaw = await textFiles.read(input.templatePath);
    } catch (error) {
      return { kind: 'template-unreadable', message: errorMessage(error) };
    }
    // Loading a template's sibling `*.refine.ts` executes arbitrary code from that file;
    // `noRefine` skips it (the structural and directive schema still runs).
    const refine = input.noRefine ? undefined : await loadRefine(input.templatePath);
    let schema: { parse(raw: string): unknown };
    try {
      schema = parseTemplate(templateRaw, { refine });
    } catch (error) {
      // A malformed or malicious template (bad directive, unsafe regex, …) throws before any
      // document is validated.
      return {
        kind: 'template-invalid',
        templatePath: input.templatePath,
        message: errorMessage(error),
      };
    }
    const documents: DocumentOutcome[] = [];
    for (const path of input.documentPaths) {
      documents.push(await validateOne(schema, path, input.emitJsonPath));
    }
    return { kind: 'validated', documents };
  };
}
