import type { BindingDiagnostic } from './binding-diagnostic.model.ts';

/**
 * How a Markdown file relates to the catalog:
 *
 * - `bound`: a template of the file's name is the closest, and only one.
 * - `unbound`: no template of that name is in reach.
 * - `ambiguous`: the closest level holds different templates of that name (two listed packages,
 *   or two skills of one, when no folder of the tree has one).
 * - `template`: the file is part of a templates folder (a template or its example).
 */
export type BindingStatus = 'bound' | 'unbound' | 'ambiguous' | 'template';

/** A Markdown file, and the template it binds to. */
export type DocumentBinding = {
  /** Root-relative path of the file. */
  path: string;
  status: BindingStatus;
  /** The template name the file's name asks for; `null` for a `template` file. */
  templateName: string | null;
  /**
   * Root-relative path of the bound `*.template.md` (`<package>/<path in the package>` for a
   * package's template); `null` unless `bound`.
   */
  templatePath: string | null;
  /** The key of the listed package the bound template comes from; absent otherwise. */
  templatePackage?: string;
  /** For `ambiguous`, the paths of the templates that clash, in order; empty otherwise. */
  candidates: string[];
  /**
   * Whether a refine companion (`<name>.refine.ts`, `.js` or `.mjs`) sits beside the bound template, so a client can tell that the
   * template's cross-section rules exist.
   */
  hasRefine: boolean;
  diagnostics: BindingDiagnostic[];
};
