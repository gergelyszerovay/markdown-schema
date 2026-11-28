/**
 * The template folders of one installed package, as the binding rules read them: the package's
 * key and the files its gateway listed under `markdown-schema-templates/` and
 * `skills/<skill>/markdown-schema-templates/`.
 */
export type TemplatePackage = {
  /**
   * The key the root `package.json` declares the package under (an npm alias by its key); a
   * template of the package is printed as `<package>/<path in the package>`.
   */
  package: string;
  /** Package-relative POSIX file paths under the package's template folders. */
  paths: readonly string[];
};
