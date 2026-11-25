import type { TextFiles } from '../core/text-files.port.ts';

/** In-memory text files with the state a test needs to arrange and observe. */
export type TextFilesFake = TextFiles & {
  /** The files by path, as the fake holds them. */
  files: Map<string, string>;
  /** Paths whose writes reject. */
  unwritable: Set<string>;
};

/**
 * Creates in-memory text files: reading a missing path and writing an unwritable one reject
 * with an Error that carries a Node-style message.
 * @param initial - The files that exist at the start, by path.
 * @returns The fake.
 */
export function makeTextFilesFake(initial: Record<string, string> = {}): TextFilesFake {
  const files = new Map(Object.entries(initial));
  const unwritable = new Set<string>();
  return {
    files,
    unwritable,
    read: (path: string): Promise<string> => {
      const content = files.get(path);
      return content === undefined
        ? Promise.reject(new Error(`ENOENT: no such file or directory, open '${path}'`))
        : Promise.resolve(content);
    },
    write: (path: string, content: string): Promise<void> => {
      if (unwritable.has(path)) {
        return Promise.reject(new Error(`EACCES: permission denied, open '${path}'`));
      }
      files.set(path, content);
      return Promise.resolve();
    },
  };
}
