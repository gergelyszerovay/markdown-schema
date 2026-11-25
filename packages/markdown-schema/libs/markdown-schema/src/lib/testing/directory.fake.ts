import type { DirectoryEntry } from '../core/binding/directory-entry.model.ts';
import type { DirectoryPort } from '../core/directory.port.ts';

/** An in-memory directory port, and the calls it saw. */
export type DirectoryFake = {
  directory: DirectoryPort;
  /** The `skipDirNames` of each `list` call, in order. */
  listCalls: (readonly string[])[];
  /** The `paths`, `templateFolders` and `skipDirNames` of each `listScope` call, in order. */
  scopeCalls: {
    paths: readonly string[];
    templateFolders: readonly string[];
    skipDirNames: readonly string[];
  }[];
};

/**
 * Creates a directory port over in-memory files. The root is `/virtual` unless the caller
 * names one; a requested path that starts with `..` is outside it; an entry below a skipped
 * directory name is left out of a listing, and a scoped listing keeps the entries under the
 * requested paths and templates folders.
 * @param files - The root-relative file paths that exist.
 * @param options - `symlinks` are root-relative paths listed as symbolic links.
 * @returns The fake.
 */
export function makeDirectoryFake(
  files: readonly string[],
  options: { symlinks?: readonly string[] } = {},
): DirectoryFake {
  const listCalls: (readonly string[])[] = [];
  const scopeCalls: DirectoryFake['scopeCalls'] = [];
  const everything = (skipDirNames: readonly string[]): DirectoryEntry[] => {
    const entries = new Map<string, DirectoryEntry>([['.', { path: '.', kind: 'directory' }]]);
    const add = (path: string, kind: 'file' | 'symlink'): void => {
      const segments = path.split('/');
      if (segments.slice(0, -1).some((segment) => skipDirNames.includes(segment))) return;
      for (let length = 1; length < segments.length; length += 1) {
        const dir = segments.slice(0, length).join('/');
        entries.set(dir, { path: dir, kind: 'directory' });
      }
      entries.set(path, { path, kind });
    };
    for (const path of files) add(path, 'file');
    for (const path of options.symlinks ?? []) add(path, 'symlink');
    return [...entries.values()].sort((left, right) =>
      left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
    );
  };
  const directory: DirectoryPort = {
    locate: (request) => {
      const outside = request.paths.find((path) => path.split('/').includes('..'));
      if (outside !== undefined) {
        return Promise.resolve({
          kind: 'refused',
          message: `Error: ${outside} is outside the root`,
        });
      }
      return Promise.resolve({
        kind: 'located',
        root: request.root ?? '/virtual',
        paths: request.paths.map((path) =>
          path.replace(/^\.\//, '').replace(/\/$/, '') === '' ? '.' : path.replace(/^\.\//, ''),
        ),
      });
    },
    list: (_root, skipDirNames) => {
      listCalls.push(skipDirNames);
      return Promise.resolve(everything(skipDirNames));
    },
    listScope: (_root, request) => {
      scopeCalls.push({
        paths: request.paths,
        templateFolders: request.templateFolders,
        skipDirNames: request.skipDirNames,
      });
      const inside = (path: string, scope: string): boolean =>
        scope === '.' || path === scope || path.startsWith(`${scope}/`);
      return Promise.resolve(
        everything(request.skipDirNames).filter(
          (entry) =>
            entry.path === '.' ||
            [...request.paths, ...request.templateFolders].some((scope) =>
              inside(entry.path, scope),
            ),
        ),
      );
    },
  };
  return { directory, listCalls, scopeCalls };
}
