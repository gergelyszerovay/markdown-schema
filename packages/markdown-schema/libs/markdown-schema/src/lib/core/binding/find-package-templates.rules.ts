import { baseName } from './base-name.rules.ts';
import type { CatalogTemplate } from './catalog-template.model.ts';
import { cleanFileSet } from './clean-file-set.rules.ts';
import { compareText } from './compare-text.rules.ts';
import type { FoundTemplates } from './find-templates.rules.ts';
import { joinPath } from './join-path.rules.ts';
import { parentDir } from './parent-dir.rules.ts';
import { refineExtensions } from './refine-extensions.model.ts';
import { templateFolderName } from './template-folder-names.model.ts';
import type { TemplatePackage } from './template-package.model.ts';

/**
 * Finds the templates of an installed package: every
 * `markdown-schema-templates/<name>/<name>.template.md` and
 * `skills/<skill>/markdown-schema-templates/<name>/<name>.template.md` of its listing, and no
 * other path (the legacy folder name `layered-doc-templates` is not read in a package). Each
 * template is printed as `<package>/<path in the package>` and carries the package's key, so
 * binding tries it only after every folder of the tree. A folder whose template file has another
 * stem is not a template and is noted.
 * @param templatePackage - The package's key and the files its template folders hold.
 * @returns The templates, ordered by path, and the notes.
 */
export function findPackageTemplates(templatePackage: TemplatePackage): FoundTemplates {
  const files = cleanFileSet(templatePackage.paths);
  const key = templatePackage.package;
  const templates: CatalogTemplate[] = [];
  const diagnostics: FoundTemplates['diagnostics'] = [];
  for (const path of [...files].sort(compareText)) {
    if (!path.endsWith('.template.md')) continue;
    const segments = path.split('/');
    const inRoot = segments.length === 3;
    const inSkill = segments.length === 5 && segments[0] === 'skills';
    if (!inRoot && !inSkill) continue;
    const name = segments[segments.length - 2] ?? '';
    if (segments[segments.length - 3] !== templateFolderName) continue;
    const printed = joinPath(key, path);
    if (baseName(path) !== `${name}.template.md`) {
      diagnostics.push({
        severity: 'info',
        code: 'template-name-mismatch',
        message: `"${printed}" is not a template: its file name must be "${name}.template.md", the name of its folder.`,
        path: printed,
      });
      continue;
    }
    const folder = parentDir(parentDir(path));
    templates.push({
      name,
      path: printed,
      folder: joinPath(key, folder),
      parent: folder === templateFolderName ? key : joinPath(key, parentDir(folder)),
      legacy: false,
      hasRefine: refineExtensions.some((extension) =>
        files.has(joinPath(joinPath(folder, name), `${name}.refine.${extension}`)),
      ),
      package: key,
    });
  }
  return { templates, diagnostics };
}
