/** What {@link bindDocuments} needs: a file list. */
export type BindDocumentsInput = {
  /** Root-relative POSIX file paths. */
  paths: readonly string[];
  /** Directory names to skip. */
  ignoredDirNames?: readonly string[];
};
