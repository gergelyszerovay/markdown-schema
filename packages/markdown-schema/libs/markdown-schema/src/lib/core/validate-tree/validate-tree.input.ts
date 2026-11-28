/** Input of the validate-tree use case; the paths are as the caller wrote them. */
export type ValidateTreeInput = {
  /** The directory templates are collected under; `undefined` for the port's default. */
  root: string | undefined;
  /** The files and directories whose documents are validated; they must lie inside the root. */
  paths: readonly string[];
  /** Directory names (anywhere) or root-relative paths to skip, beyond the built-in ones. */
  ignore: readonly string[];
  /** Skips every template's sibling refine companion, so no code from it is executed. */
  noRefine: boolean;
  /**
   * Package keys read for templates in this run beyond the root's
   * `markdownSchema.templatePackages` (`--template-package`); none when absent.
   */
  templatePackages?: readonly string[];
  /** Reads no package's templates: ignores the root's list and `templatePackages`. */
  noTemplatePackages?: boolean;
};
