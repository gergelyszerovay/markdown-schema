/**
 * One template of the catalog: a `<name>/<name>.template.md` inside a templates folder of the
 * tree, or of an installed package the root lists.
 */
export type CatalogTemplate = {
  /** The template's name, the name of its folder and the stem of its file. */
  name: string;
  /**
   * Root-relative path of the `<name>.template.md`; for a package's template,
   * `<package>/<path in the package>`.
   */
  path: string;
  /** The templates folder it sits in, such as `skills/x/markdown-schema-templates`. */
  folder: string;
  /** The directory that holds the templates folder; templates of one directory are one level. */
  parent: string;
  /** Whether the folder carries the legacy name `layered-doc-templates`. */
  legacy: boolean;
  /**
   * Whether a `<name>.refine.ts`, `.refine.js` or `.refine.mjs` sits beside the template.
   * Binding never loads it.
   */
  hasRefine: boolean;
  /**
   * The key of the listed package the template comes from; absent for a template of the tree.
   * A package's template is tried only after every folder of the tree.
   */
  package?: string;
};
