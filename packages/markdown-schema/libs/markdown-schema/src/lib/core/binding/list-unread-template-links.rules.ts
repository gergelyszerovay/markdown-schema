import { baseName } from './base-name.rules.ts';
import type { DirectoryEntry } from './directory-entry.model.ts';
import { joinPath } from './join-path.rules.ts';
import { parentDir } from './parent-dir.rules.ts';
import { templateFolderNames } from './template-folder-names.model.ts';
import type { UnreadTemplateLink } from './unread-template-link.model.ts';

/**
 * Lists the template links of a listing that stand for no template: a link
 * `<templates folder>/<name>` to a directory inside the root where the listing holds no
 * `<name>.template.md`. Either the template is missing there, or the way to it crosses a
 * symbolic link or a skipped folder (such as `node_modules`), which a listing never enters, so
 * a document asking for `<name>` is not bound to it. A link that points outside the root or
 * nowhere is not listed.
 * @param entries - The entries of a listing, as a {@link DirectoryPort} reports them.
 * @returns The links, in listing order.
 */
export function listUnreadTemplateLinks(entries: readonly DirectoryEntry[]): UnreadTemplateLink[] {
  const files = new Set(
    entries.filter((entry) => entry.kind === 'file').map((entry) => entry.path),
  );
  const unread: UnreadTemplateLink[] = [];
  for (const entry of entries) {
    if (entry.kind !== 'symlink' || entry.target === undefined) continue;
    if (!templateFolderNames.includes(baseName(parentDir(entry.path)))) continue;
    const name = baseName(entry.path);
    if (!files.has(joinPath(entry.target, `${name}.template.md`))) {
      unread.push({ path: entry.path, name, target: entry.target });
    }
  }
  return unread;
}
