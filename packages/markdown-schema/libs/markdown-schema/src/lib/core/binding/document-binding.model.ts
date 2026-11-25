import type { BindingDiagnostic } from './binding-diagnostic.model.ts';

/**
 * How a Markdown file relates to the catalog:
 *
 * - `bound`: a template of the file's name is the closest, and only one.
 * - `unbound`: no template of that name is in reach.
 * - `ambiguous`: the closest level holds different templates of that name.
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
  /** Root-relative path of the bound `*.template.md`; `null` unless `bound`. */
  templatePath: string | null;
  /** For `ambiguous`, the paths of the templates that clash, in order; empty otherwise. */
  candidates: string[];
  /**
   * Whether a `<name>.refine.ts` sits beside the bound template, so a client can tell that the
   * template's cross-section rules exist.
   */
  hasRefine: boolean;
  diagnostics: BindingDiagnostic[];
};
