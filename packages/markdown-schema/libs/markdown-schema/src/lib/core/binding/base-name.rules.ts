/**
 * Returns the last segment of a root-relative POSIX path.
 * @param path - A file or directory path.
 * @returns The segment after the last `/`, or the whole path when it has none.
 */
export function baseName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}
