/**
 * Joins a directory and a name into a root-relative POSIX path.
 * @param directory - A directory path; `.` is the root.
 * @param name - A file or directory name.
 * @returns The path of the name inside the directory, without a leading `./`.
 */
export function joinPath(directory: string, name: string): string {
  return directory === '.' ? name : `${directory}/${name}`;
}
