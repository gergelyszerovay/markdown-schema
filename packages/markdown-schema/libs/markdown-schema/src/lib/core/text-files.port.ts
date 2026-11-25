/**
 * Secondary port that reads and writes UTF-8 text files, so the use cases never touch the
 * file system themselves. Relative paths resolve against the working directory.
 * @failure `read` rejects with the underlying error when the file cannot be read, and
 * `write` when it cannot be written; the error's message is shown to the user, unchanged.
 */
export type TextFiles = {
  /** Returns the file's contents. */
  read(path: string): Promise<string>;
  /** Writes the contents, creating missing parent directories first. */
  write(path: string, content: string): Promise<void>;
};
