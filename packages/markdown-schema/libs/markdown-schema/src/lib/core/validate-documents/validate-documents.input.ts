/** Input of the validate-documents use case; paths are used exactly as the caller gave them. */
export type ValidateDocumentsInput = {
  /** The `*.template.md` file that defines the schema. */
  templatePath: string;
  /** The documents to validate, in the order to report them. */
  documentPaths: readonly string[];
  /** Where to write the parsed document as JSON; only valid with exactly one document. */
  emitJsonPath: string | undefined;
  /** Skips the template's sibling `*.refine.ts`, so no code from it is executed. */
  noRefine: boolean;
};
