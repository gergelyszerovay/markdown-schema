import { baseName } from './base-name.rules.ts';
import type { DirectoryEntry } from './directory-entry.model.ts';
import { joinPath } from './join-path.rules.ts';
import { parentDir } from './parent-dir.rules.ts';
import { templateFolderNames } from './template-folder-names.model.ts';

/**
 * Lists the file paths of a directory listing for the catalog and for binding. A symbolic link
 * is never followed, with one exception: a link `<templates folder>/<name>` to a directory
 * inside the listing stands for that template, so the template file and its refine file the
 * directory holds show up under the link's path, and a folder of links can share templates that
 * live elsewhere. The template is read through the link.
 * @param entries - The entries of a listing, as a {@link DirectoryPort} reports them.
 * @returns The paths of the files, then the paths that stand for a linked template's files.
 */
export function listFilePaths(entries: readonly DirectoryEntry[]): string[] {
  const files = new Set(
    entries.filter((entry) => entry.kind === 'file').map((entry) => entry.path),
  );
  const linked: string[] = [];
  for (const entry of entries) {
    if (entry.kind !== 'symlink' || entry.target === undefined) continue;
    if (!templateFolderNames.includes(baseName(parentDir(entry.path)))) continue;
    const name = baseName(entry.path);
    for (const stem of [`${name}.template.md`, `${name}.refine.ts`, `${name}.refine.js`]) {
      if (files.has(joinPath(entry.target, stem))) linked.push(joinPath(entry.path, stem));
    }
  }
  return [...files, ...linked];
}
