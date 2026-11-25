/**
 * Returns the directory that holds a root-relative POSIX path.
 * @param path - A file or directory path; `.` is the root.
 * @returns The parent directory; `.` for a top-level path and for the root itself.
 */
export function parentDir(path: string): string {
  const slash = path.lastIndexOf('/');
  return slash === -1 ? '.' : path.slice(0, slash);
}
