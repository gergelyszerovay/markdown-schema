import { baseName } from './base-name.rules.ts';
import type { BindDocumentsInput } from './bind-documents-input.model.ts';
import type { BindDocumentsResult } from './bind-documents-result.model.ts';
import { cleanFileSet } from './clean-file-set.rules.ts';
import type { CatalogTemplate } from './catalog-template.model.ts';
import { compareText } from './compare-text.rules.ts';
import type { DocumentBinding } from './document-binding.model.ts';
import { findPackageTemplates } from './find-package-templates.rules.ts';
import { findTemplates } from './find-templates.rules.ts';
import { parentDir } from './parent-dir.rules.ts';
import { templateFolderNames } from './template-folder-names.model.ts';
import { templateNamesOf } from './template-name.rules.ts';

/**
 * Narrows the templates of one folder level to the one a document binds to: a legacy folder
 * loses to a canonical one in the same directory.
 * @param candidates - The templates of the document's name whose folder sits in one directory.
 * @returns The template.
 */
function resolveCandidates(candidates: readonly CatalogTemplate[]): CatalogTemplate | undefined {
  return candidates.find((candidate) => !candidate.legacy) ?? candidates[0];
}

/**
 * Binds one file that is not part of a templates folder.
 * @param path - The file's root-relative path.
 * @param byName - The catalog, by template name.
 * @returns The binding.
 */
function bindDocument(
  path: string,
  byName: ReadonlyMap<string, readonly CatalogTemplate[]>,
): DocumentBinding {
  const names = templateNamesOf(baseName(path));
  const templateName = names.find((name) => byName.has(name)) ?? names[0] ?? null;
  const base: DocumentBinding = {
    path,
    status: 'unbound',
    templateName,
    templatePath: null,
    candidates: [],
    hasRefine: false,
    diagnostics: [],
  };
  const named = templateName === null ? undefined : byName.get(templateName);
  if (named === undefined) return base;

  const inTree = named.filter((template) => template.package === undefined);
  let directory = parentDir(path);
  for (;;) {
    const inReach = inTree.filter((template) => template.parent === directory);
    const template = resolveCandidates(inReach);
    if (template !== undefined) {
      return {
        ...base,
        status: 'bound',
        templatePath: template.path,
        hasRefine: template.hasRefine,
      };
    }
    if (directory === '.') break;
    directory = parentDir(directory);
  }

  // The listed packages are one level above the root: one template binds, more are a clash.
  const inPackages = named.filter((template) => template.package !== undefined);
  const [only] = inPackages;
  if (only === undefined) return base;
  if (inPackages.length > 1) {
    return {
      ...base,
      status: 'ambiguous',
      candidates: inPackages.map((template) => template.path),
    };
  }
  return {
    ...base,
    status: 'bound',
    templatePath: only.path,
    templatePackage: only.package,
    hasRefine: only.hasRefine,
  };
}

/**
 * Binds every Markdown file of a file list to its template, from the path list alone. A file
 * named `[<n>.][<artifact>.]<template>.md` binds to the closest template of that name: walking
 * up from its directory, each ancestor's own templates folder is searched (not its subtree),
 * and the first ancestor that has one decides. A file whose name is all upper case
 * (`CHANGELOG.md`) binds to the template of that name, else to the lower-case one (`changelog`). A file inside a templates folder is a
 * `template`, bound to nothing. The templates of the listed packages form a level above the
 * root: a document binds to one only when no folder of the tree has a template of its name, so a
 * template in the root's own folder overrides a package's; two package templates of that name
 * (two packages, or two skills of one) make the document `ambiguous`. A package's files are
 * catalog only, never documents. Binding knows nothing of layered-docs trees. Nothing is read; a
 * template's refine file is only looked for.
 * @param input - The file list.
 * @returns The bindings, ordered by path.
 */
export function bindDocuments(input: BindDocumentsInput): BindDocumentsResult {
  const files = cleanFileSet(input.paths);
  const ignoredDirNames = new Set(input.ignoredDirNames ?? []);
  const { templates: treeTemplates } = findTemplates(files, ignoredDirNames);
  const templates = [
    ...treeTemplates,
    ...(input.packages ?? []).flatMap(
      (templatePackage) => findPackageTemplates(templatePackage).templates,
    ),
  ];
  const byName = new Map<string, CatalogTemplate[]>();
  for (const template of templates) {
    byName.set(template.name, [...(byName.get(template.name) ?? []), template]);
  }

  const documents: DocumentBinding[] = [];
  for (const path of [...files].sort(compareText)) {
    if (!/\.md$/i.test(path)) continue;
    const directories = path.split('/').slice(0, -1);
    if (directories.some((name) => ignoredDirNames.has(name))) continue;
    if (directories.some((name) => templateFolderNames.includes(name))) {
      documents.push({
        path,
        status: 'template',
        templateName: null,
        templatePath: null,
        candidates: [],
        hasRefine: false,
        diagnostics: [],
      });
      continue;
    }
    documents.push(bindDocument(path, byName));
  }
  return { documents };
}
