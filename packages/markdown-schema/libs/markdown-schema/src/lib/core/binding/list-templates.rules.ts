import { cleanFileSet } from './clean-file-set.rules.ts';
import { compareText } from './compare-text.rules.ts';
import { findPackageTemplates } from './find-package-templates.rules.ts';
import { findTemplates } from './find-templates.rules.ts';
import type { ListTemplatesInput } from './list-templates-input.model.ts';
import type { ListTemplatesResult, TemplateNameClash } from './list-templates-result.model.ts';

/**
 * Lists the catalog of a file list from its paths alone: every
 * `markdown-schema-templates/<name>/<name>.template.md`, and every legacy
 * `layered-doc-templates/<name>/<name>.template.md`, then the templates of each listed package
 * (its `markdown-schema-templates/` and `skills/<skill>/markdown-schema-templates/`, printed as
 * `<package>/<path in the package>`). Names carried by more than one template
 * are reported as clashes; whether a clash makes a document ambiguous depends on where the
 * document sits (see {@link bindDocuments}).
 * @param input - The file list.
 * @returns The templates, the name clashes and the notes.
 */
export function listTemplates(input: ListTemplatesInput): ListTemplatesResult {
  const found = [
    findTemplates(cleanFileSet(input.paths), new Set(input.ignoredDirNames ?? [])),
    ...(input.packages ?? []).map(findPackageTemplates),
  ];
  const templates = found.flatMap((part) => part.templates);
  const diagnostics = found.flatMap((part) => part.diagnostics);

  const byName = new Map<string, string[]>();
  for (const template of templates) {
    byName.set(template.name, [...(byName.get(template.name) ?? []), template.path]);
  }
  const clashes: TemplateNameClash[] = [...byName]
    .filter(([, paths]) => paths.length > 1)
    .map(([name, paths]) => ({ name, paths }))
    .sort((a, b) => compareText(a.name, b.name));
  for (const clash of clashes) {
    diagnostics.push({
      severity: 'info',
      code: 'template-name-shared',
      message: `Template name "${clash.name}" is carried by ${String(clash.paths.length)} templates: ${clash.paths.join(', ')}.`,
    });
  }
  return { templates, clashes, diagnostics };
}
