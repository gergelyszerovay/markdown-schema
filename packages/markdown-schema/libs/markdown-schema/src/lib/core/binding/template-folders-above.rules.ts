import { joinPath } from './join-path.rules.ts';
import { templateFolderNames } from './template-folder-names.model.ts';

/**
 * Lists the templates folders a binding can need beyond the paths it was asked about: the
 * templates folder of every proper ancestor of each path, the root included. A document binds
 * by looking only in each ancestor's own templates folder, so these folders, with the paths
 * themselves, are everything that decides the binding of a document under those paths.
 * @param paths - Root-relative POSIX paths; `.` is the root, which has no ancestor.
 * @returns The templates folder paths, each once, in the order the ancestors are met from the
 *   root down, canonical name before legacy.
 */
export function templateFoldersAbove(paths: readonly string[]): string[] {
  const folders = new Set<string>();
  for (const path of paths) {
    if (path === '.') continue;
    const segments = path.split('/');
    for (let length = 0; length < segments.length; length += 1) {
      const ancestor = length === 0 ? '.' : segments.slice(0, length).join('/');
      for (const name of templateFolderNames) folders.add(joinPath(ancestor, name));
    }
  }
  return [...folders];
}
