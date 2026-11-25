import type { BindingDiagnostic } from './binding-diagnostic.model.ts';
import type { CatalogTemplate } from './catalog-template.model.ts';

/** A template name that more than one template of the catalog carries. */
export type TemplateNameClash = {
  /** The shared template name. */
  name: string;
  /** Root-relative paths of the templates that carry it, in order. */
  paths: string[];
};

/** The catalog of a file list. */
export type ListTemplatesResult = {
  /** Every template, ordered by path. */
  templates: CatalogTemplate[];
  /** The names carried by more than one template, ordered by name. */
  clashes: TemplateNameClash[];
  diagnostics: BindingDiagnostic[];
};
