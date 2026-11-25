import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { TextFiles } from '../core/text-files.port.ts';

/**
 * Creates the file-system implementation of the text-files port.
 * @returns The adapter; it holds no state.
 * @failure A file that cannot be read or written rejects with the Node file-system error,
 * whose message names the absolute path; nothing is translated.
 */
export function makeNodeTextFiles(): TextFiles {
  return {
    read: (path: string): Promise<string> => readFile(resolve(path), 'utf-8'),
    write: async (path: string, content: string): Promise<void> => {
      const target = resolve(path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, content, 'utf-8');
    },
  };
}
