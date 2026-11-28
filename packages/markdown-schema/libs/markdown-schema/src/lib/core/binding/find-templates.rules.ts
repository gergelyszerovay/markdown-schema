import { baseName } from './base-name.rules.ts';
import type { BindingDiagnostic } from './binding-diagnostic.model.ts';
import type { CatalogTemplate } from './catalog-template.model.ts';
import { compareText } from './compare-text.rules.ts';
import { joinPath } from './join-path.rules.ts';
import { parentDir } from './parent-dir.rules.ts';
import { refineExtensions } from './refine-extensions.model.ts';
import { legacyTemplateFolderName, templateFolderNames } from './template-folder-names.model.ts';

/** What {@link findTemplates} found. */
export type FoundTemplates = {
  templates: CatalogTemplate[];
  diagnostics: BindingDiagnostic[];
};

/**
 * Finds the templates of a file list: every `<name>/<name>.template.md` inside a templates
 * folder, skipping what sits below an ignored directory. A folder whose template file has
 * another stem is not a template and is noted. A symbolic link is not in the file list, so it
 * is no template, except through {@link listFilePaths}, which lists a linked template's files.
 * @param files - Cleaned root-relative POSIX file paths.
 * @param ignoredDirNames - Directory names to skip.
 * @returns The templates, ordered by path, and the notes.
 */
export function findTemplates(
  files: ReadonlySet<string>,
  ignoredDirNames: ReadonlySet<string>,
): FoundTemplates {
  const templates: CatalogTemplate[] = [];
  const diagnostics: BindingDiagnostic[] = [];
  for (const path of [...files].sort(compareText)) {
    if (!path.endsWith('.template.md')) continue;
    const segments = path.split('/');
    if (segments.slice(0, -1).some((segment) => ignoredDirNames.has(segment))) continue;
    if (segments.length < 3) continue;
    const name = segments[segments.length - 2] ?? '';
    const folderName = segments[segments.length - 3] ?? '';
    if (!templateFolderNames.includes(folderName)) continue;
    if (baseName(path) !== `${name}.template.md`) {
      diagnostics.push({
        severity: 'info',
        code: 'template-name-mismatch',
        message: `"${path}" is not a template: its file name must be "${name}.template.md", the name of its folder.`,
        path,
      });
      continue;
    }
    const folder = parentDir(parentDir(path));
    templates.push({
      name,
      path,
      folder,
      parent: parentDir(folder),
      legacy: folderName === legacyTemplateFolderName,
      hasRefine: refineExtensions.some((extension) =>
        files.has(joinPath(joinPath(folder, name), `${name}.refine.${extension}`)),
      ),
    });
  }
  return { templates, diagnostics };
}
