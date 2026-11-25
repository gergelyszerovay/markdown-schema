/** One template of the catalog: a `<name>/<name>.template.md` inside a templates folder. */
export type CatalogTemplate = {
  /** The template's name, the name of its folder and the stem of its file. */
  name: string;
  /** Root-relative path of the `<name>.template.md`. */
  path: string;
  /** The templates folder it sits in, such as `skills/x/markdown-schema-templates`. */
  folder: string;
  /** The directory that holds the templates folder; templates of one directory are one level. */
  parent: string;
  /** Whether the folder carries the legacy name `layered-doc-templates`. */
  legacy: boolean;
  /** Whether a `<name>.refine.ts` sits beside the template. Binding never loads it. */
  hasRefine: boolean;
};
