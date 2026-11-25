import type { DirectoryEntry } from './binding/directory-entry.model.ts';
import type { Located } from './located.model.ts';

/**
 * Secondary port that finds the root of a run and lists the entries under it, so the use
 * cases never touch the file system themselves. It only lists; it never reads a file's
 * contents and never follows a symbolic link.
 * @failure `locate` refuses, rather than rejects, a root that is not a directory and a path
 * outside the root. `list` and `listScope` reject with the underlying error when a directory
 * cannot be listed.
 */
export type DirectoryPort = {
  /**
   * Resolves the root and the paths of a run.
   * @param request - The root as the caller wrote it, or `undefined` for the default (the
   *   nearest ancestor of the working directory that holds `.git`, else the working
   *   directory), and the paths as the caller wrote them, relative to the working directory.
   * @returns The root and the root-relative paths, or why they are unusable.
   */
  locate(request: { root: string | undefined; paths: readonly string[] }): Promise<Located>;
  /**
   * Lists every entry under the root, the root directory `.` first, ordered by path.
   * @param root - The root {@link DirectoryPort.locate} returned.
   * @param skipDirNames - Directory names whose contents are left out, wherever they sit.
   * @returns The entries.
   */
  list(root: string, skipDirNames: readonly string[]): Promise<DirectoryEntry[]>;
  /**
   * Lists only what a binding under some paths can depend on: the entries of each requested
   * path (the file itself, or the folder walked), the entries of each templates folder that
   * exists, and, for every symbolic link inside a templates folder, the files of the directory
   * the link points to when that is inside the root. The root directory `.` comes first and the
   * rest is ordered by path. When a path is the root itself and the root is the top level of a
   * Git work tree, the files are those Git tracks plus those it does not ignore, so ignored
   * trees cost nothing; that listing has no directory entries besides `.`, leaves out nested
   * repositories and submodules, and does not read the directories symbolic links point to
   * (the linked files are listed where they sit). A folder is always walked from disk. An
   * entry whose path crosses a symbolic link is left out, as in {@link DirectoryPort.list},
   * except the files of a directory that a link inside a templates folder points to, when
   * nothing on the way there is a link.
   * @param root - The root {@link DirectoryPort.locate} returned.
   * @param request - The root-relative `paths` to walk, the root-relative `templateFolders` to
   *   list when they exist, and the `skipDirNames` whose contents are left out.
   * @returns The entries.
   */
  listScope(
    root: string,
    request: {
      paths: readonly string[];
      templateFolders: readonly string[];
      skipDirNames: readonly string[];
    },
  ): Promise<DirectoryEntry[]>;
};
