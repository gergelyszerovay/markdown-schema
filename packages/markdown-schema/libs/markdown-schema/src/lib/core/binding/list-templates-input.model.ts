/** What {@link listTemplates} needs: a file list. */
export type ListTemplatesInput = {
  /** Root-relative POSIX file paths. */
  paths: readonly string[];
  /** Directory names to skip. */
  ignoredDirNames?: readonly string[];
};
