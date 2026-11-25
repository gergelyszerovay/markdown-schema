import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { lstat, readdir, readlink, stat } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import type { DirectoryEntry } from '../core/binding/directory-entry.model.ts';
import { templateFolderNames } from '../core/binding/template-folder-names.model.ts';
import type { DirectoryPort } from '../core/directory.port.ts';
import type { Located } from '../core/located.model.ts';

/**
 * Finds the root a run works on when none is given: the nearest ancestor of the starting
 * directory that holds `.git`, as a directory or as a file (a worktree has a file).
 * @param start - Absolute path of the directory to start from.
 * @returns The ancestor's absolute path, or the starting directory when none has `.git`.
 */
function findGitRoot(start: string): string {
  let current = start;
  for (;;) {
    if (existsSync(path.join(current, '.git'))) return current;
    const parent = path.dirname(current);
    if (parent === current) return start;
    current = parent;
  }
}

/**
 * Resolves where a symbolic link points, when that is inside the root.
 * @param root - Absolute root.
 * @param link - Absolute path of the link.
 * @returns The root-relative POSIX target, or `undefined` for a link that points outside the
 *   root or nowhere.
 */
async function linkTarget(root: string, link: string): Promise<string | undefined> {
  let target: string;
  try {
    target = await readlink(link);
  } catch {
    return undefined;
  }
  const relative = path.relative(root, path.resolve(path.dirname(link), target));
  if (relative === '' || relative === '..' || relative.startsWith(`..${path.sep}`))
    return undefined;
  return path.isAbsolute(relative) ? undefined : relative.split(path.sep).join('/');
}

/**
 * Orders entries by path.
 * @param entries - The entries.
 * @returns The same entries, sorted in place.
 */
function sortByPath(entries: DirectoryEntry[]): DirectoryEntry[] {
  return entries.sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
  );
}

/**
 * Walks a directory and adds what is below it. A symbolic link is listed, never followed, and
 * a directory whose name is skipped is not entered.
 * @param root - Absolute root.
 * @param relativeDirectory - Root-relative path of the directory to walk; `.` is the root.
 * @param skipped - Directory names whose contents are left out.
 * @param add - Receives each entry.
 * @returns Resolves when the directory is walked.
 */
async function walkDirectory(
  root: string,
  relativeDirectory: string,
  skipped: ReadonlySet<string>,
  add: (entry: DirectoryEntry) => void,
): Promise<void> {
  const absoluteDirectory = path.join(root, relativeDirectory);
  const children = await readdir(absoluteDirectory, { withFileTypes: true });
  for (const child of children) {
    const relativePath = path.posix.join(relativeDirectory, child.name);
    if (child.isSymbolicLink()) {
      const target = await linkTarget(root, path.join(absoluteDirectory, child.name));
      add(
        target === undefined
          ? { path: relativePath, kind: 'symlink' }
          : { path: relativePath, kind: 'symlink', target },
      );
    } else if (child.isDirectory()) {
      if (skipped.has(child.name)) continue;
      add({ path: relativePath, kind: 'directory' });
      await walkDirectory(root, relativePath, skipped, add);
    } else if (child.isFile()) {
      add({ path: relativePath, kind: 'file' });
    }
  }
}

/** The most output `git ls-files` may produce, in bytes. */
const gitListingLimit = 512 * 1024 * 1024;

/** How many paths are checked on disk at a time. */
const statBatchSize = 64;

/**
 * Lists the files of a Git work tree: those Git tracks and those it does not ignore. A deleted
 * tracked file, a directory (a submodule or a nested repository) and a path below a skipped
 * directory name are left out; a symbolic link is listed as one, never followed.
 * @param root - Absolute root.
 * @param skipped - Directory names whose contents are left out.
 * @returns The entries, or `undefined` when the root is not the top level of a Git work tree
 *   (it holds no `.git`, so an outer work tree that ignores it would list nothing) or Git
 *   fails.
 */
async function listGitFiles(
  root: string,
  skipped: ReadonlySet<string>,
): Promise<DirectoryEntry[] | undefined> {
  if (!existsSync(path.join(root, '.git'))) return undefined;
  let output: string;
  try {
    const result = await promisify(execFile)(
      'git',
      ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
      { cwd: root, maxBuffer: gitListingLimit, encoding: 'utf-8' },
    );
    output = result.stdout;
  } catch {
    return undefined;
  }
  const paths = [...new Set(output.split('\0').filter((entry) => entry !== ''))].filter(
    (entry) =>
      !entry
        .split('/')
        .slice(0, -1)
        .some((segment) => skipped.has(segment)),
  );
  const entries: DirectoryEntry[] = [];
  for (let start = 0; start < paths.length; start += statBatchSize) {
    const batch = await Promise.all(
      paths
        .slice(start, start + statBatchSize)
        .map(async (entry): Promise<DirectoryEntry | null> => {
          const absolute = path.join(root, entry);
          try {
            const stats = await lstat(absolute);
            if (stats.isSymbolicLink()) {
              const target = await linkTarget(root, absolute);
              return target === undefined
                ? { path: entry, kind: 'symlink' }
                : { path: entry, kind: 'symlink', target };
            }
            return stats.isFile() ? { path: entry, kind: 'file' } : null;
          } catch {
            return null;
          }
        }),
    );
    for (const entry of batch) if (entry !== null) entries.push(entry);
  }
  return entries;
}

/**
 * Creates the file-system implementation of the directory port. The default root is the
 * nearest ancestor of the working directory that holds `.git`. A symbolic link is listed,
 * never followed, with one exception: `listScope` reads the directory a link inside a templates
 * folder points to, when nothing on the way there is a link. For a root that holds `.git`,
 * `listScope` asks Git for the files (so it skips ignored files, nested repositories and
 * submodules, and returns no directory entries but `.`); anywhere else it walks the disk.
 * It only lists; it never reads a file or writes.
 * @param options - The working directory paths are resolved against; defaults to the
 *   process's.
 * @returns The adapter; it holds no state.
 * @failure `locate` refuses a root that is not a directory and a path that is missing or
 * outside the root; `list` and `listScope` reject with the Node file-system error of a
 * directory they cannot list. When Git is missing or fails, `listScope` walks the disk instead.
 */
export function makeNodeDirectory(options: { cwd?: string } = {}): DirectoryPort {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  return {
    async locate(request): Promise<Located> {
      const root = request.root === undefined ? findGitRoot(cwd) : path.resolve(cwd, request.root);
      try {
        if (!(await stat(root)).isDirectory()) {
          return { kind: 'refused', message: `Error: root ${root} is not a directory` };
        }
      } catch {
        return { kind: 'refused', message: `Error: root ${root} does not exist` };
      }
      const paths: string[] = [];
      for (const requested of request.paths) {
        const absolute = path.resolve(cwd, requested);
        const relative = path.relative(root, absolute);
        if (
          relative === '..' ||
          relative.startsWith(`..${path.sep}`) ||
          path.isAbsolute(relative)
        ) {
          return {
            kind: 'refused',
            message: `Error: ${requested} is outside the root ${root}`,
          };
        }
        if (!existsSync(absolute)) {
          return { kind: 'refused', message: `Error: ${requested} does not exist` };
        }
        paths.push(relative === '' ? '.' : relative.split(path.sep).join('/'));
      }
      return { kind: 'located', root, paths };
    },

    async list(root, skipDirNames): Promise<DirectoryEntry[]> {
      const skipped = new Set(skipDirNames);
      const entries: DirectoryEntry[] = [{ path: '.', kind: 'directory' }];
      await walkDirectory(root, '.', skipped, (entry) => entries.push(entry));
      return sortByPath(entries);
    },

    async listScope(root, request): Promise<DirectoryEntry[]> {
      const skipped = new Set(request.skipDirNames);
      const entries = new Map<string, DirectoryEntry>([['.', { path: '.', kind: 'directory' }]]);
      const add = (entry: DirectoryEntry): void => {
        entries.set(entry.path, entry);
      };
      // A path is listed only when nothing above it is a skipped name or a symbolic link, as
      // in a walk from the root.
      const reachable = async (relative: string): Promise<boolean> => {
        const segments = relative.split('/');
        if (segments.slice(0, -1).some((segment) => skipped.has(segment))) return false;
        for (let length = 1; length < segments.length; length += 1) {
          try {
            const stats = await lstat(path.join(root, ...segments.slice(0, length)));
            if (!stats.isDirectory()) return false;
          } catch {
            return false;
          }
        }
        return true;
      };
      const collect = async (relative: string): Promise<void> => {
        if (!(await reachable(relative))) return;
        const absolute = path.join(root, relative);
        let stats;
        try {
          stats = await lstat(absolute);
        } catch {
          return;
        }
        if (stats.isSymbolicLink()) {
          const target = await linkTarget(root, absolute);
          add(
            target === undefined
              ? { path: relative, kind: 'symlink' }
              : { path: relative, kind: 'symlink', target },
          );
        } else if (stats.isFile()) {
          add({ path: relative, kind: 'file' });
        } else if (stats.isDirectory()) {
          if (skipped.has(path.posix.basename(relative))) return;
          add({ path: relative, kind: 'directory' });
          await walkDirectory(root, relative, skipped, add);
        }
      };

      let fromGit: DirectoryEntry[] | undefined;
      if (request.paths.includes('.')) fromGit = await listGitFiles(root, skipped);
      if (fromGit !== undefined) {
        for (const entry of fromGit) add(entry);
      } else {
        for (const relative of request.paths) {
          if (relative === '.') await walkDirectory(root, '.', skipped, add);
          else await collect(relative);
        }
        for (const folder of request.templateFolders) await collect(folder);
        // A linked template's files live where the link points, which may be outside the paths.
        const links = [...entries.values()].filter(
          (entry) =>
            entry.kind === 'symlink' &&
            entry.target !== undefined &&
            templateFolderNames.includes(path.posix.basename(path.posix.dirname(entry.path))),
        );
        for (const link of links) {
          const target = link.target ?? '';
          if (target.split('/').some((segment) => skipped.has(segment))) continue;
          if (!(await reachable(target))) continue;
          let children;
          try {
            if (!(await lstat(path.join(root, target))).isDirectory()) continue;
            children = await readdir(path.join(root, target), { withFileTypes: true });
          } catch {
            continue;
          }
          for (const child of children) {
            const childPath = path.posix.join(target, child.name);
            if (child.isFile() && !entries.has(childPath)) add({ path: childPath, kind: 'file' });
          }
        }
      }
      return sortByPath([...entries.values()]);
    },
  };
}
