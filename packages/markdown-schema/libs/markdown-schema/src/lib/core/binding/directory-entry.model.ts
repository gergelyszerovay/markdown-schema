/** One path under a root, as a directory listing reports it. */
export type DirectoryEntry = {
  /** Root-relative POSIX path; the root directory is `.`. */
  path: string;
  /** The entry kind the listing reports; a symlink is never followed. */
  kind: 'file' | 'directory' | 'symlink';
  /**
   * For a symlink, the root-relative POSIX path it resolves to, when that is inside the
   * root; absent for a link that points outside it or nowhere.
   */
  target?: string;
};
