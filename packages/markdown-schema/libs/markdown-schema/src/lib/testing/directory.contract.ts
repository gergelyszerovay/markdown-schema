import { describe, expect, it } from 'vitest';
import type { DirectoryPort } from '../core/directory.port.ts';

/** What a directory contract run needs from an implementation and its storage. */
export type DirectoryHarness = {
  directory: DirectoryPort;
  /** The root to list. */
  root: string;
  /** Releases what the harness holds. */
  cleanup(): Promise<void>;
};

/**
 * The contract suite of the directory port: run it against the fake and against every
 * adapter, so they agree on listing.
 * @param name - The implementation's name, shown in the suite title.
 * @param setUp - Creates a harness whose storage holds `a.md`, `docs/b.md`,
 *   `node_modules/x/c.md` and `docs/node_modules/d.md`, and a symbolic link `link.md`.
 */
export const directoryContract = (name: string, setUp: () => Promise<DirectoryHarness>): void => {
  describe(`Directory contract: ${name}`, () => {
    it(
      'lists the root first, every file and directory, in path order, and a link as a link',
      {
        tags: ['scenario'],
        meta: {
          spec: 'directory-list-reports-entries-in-order',
          arrange: 'a tree with files, a directory and a symbolic link',
          act: 'the root is listed with nothing skipped',
          assert: 'the root comes first, then every entry ordered by path, the link as a symlink',
        },
      },
      async () => {
        let harness: DirectoryHarness;
        let entries: Awaited<ReturnType<DirectoryPort['list']>>;
        arrange: {
          harness = await setUp();
        }
        act: {
          entries = await harness.directory.list(harness.root, []);
        }
        assert: {
          expect(entries[0]).toEqual({ path: '.', kind: 'directory' });
          const paths = entries.map((entry) => entry.path);
          expect(paths).toEqual([...paths].sort());
          expect(entries.find((entry) => entry.path === 'link.md')?.kind).toBe('symlink');
          expect(entries.find((entry) => entry.path === 'docs/b.md')?.kind).toBe('file');
          expect(entries.find((entry) => entry.path === 'docs')?.kind).toBe('directory');
          await harness.cleanup();
        }
      },
    );

    it(
      'leaves out what sits below a skipped directory name, wherever the directory is',
      {
        tags: ['edge-case'],
        meta: {
          spec: 'directory-list-skips-named-directories',
          arrange: 'a tree with a node_modules directory at the top and one below docs',
          act: 'the root is listed skipping node_modules',
          assert: 'no path has a node_modules segment, and the other files are still listed',
        },
      },
      async () => {
        let harness: DirectoryHarness;
        let paths: string[];
        arrange: {
          harness = await setUp();
        }
        act: {
          paths = (await harness.directory.list(harness.root, ['node_modules'])).map(
            (entry) => entry.path,
          );
        }
        assert: {
          expect(paths.filter((path) => path.split('/').includes('node_modules'))).toEqual([]);
          expect(paths).toContain('a.md');
          expect(paths).toContain('docs/b.md');
          await harness.cleanup();
        }
      },
    );

    it(
      'lists only the requested paths and the named templates folders, the root first',
      {
        tags: ['scenario'],
        meta: {
          spec: 'directory-list-scope-reports-requested-paths-only',
          arrange: 'a tree with files at the top, below docs and below node_modules',
          act: 'the folder docs and the file a.md are listed as a scope, skipping node_modules',
          assert: 'the root, a.md and docs/b.md are listed, nothing else, in path order',
        },
      },
      async () => {
        let harness: DirectoryHarness;
        let paths: string[];
        arrange: {
          harness = await setUp();
        }
        act: {
          paths = (
            await harness.directory.listScope(harness.root, {
              paths: ['docs', 'a.md'],
              templateFolders: ['markdown-schema-templates'],
              skipDirNames: ['node_modules'],
            })
          ).map((entry) => entry.path);
        }
        assert: {
          expect(paths).toEqual(['.', 'a.md', 'docs', 'docs/b.md']);
          await harness.cleanup();
        }
      },
    );

    it(
      'lists the whole root for the root path, skipping the named directories',
      {
        tags: ['edge-case'],
        meta: {
          spec: 'directory-list-scope-root-lists-everything',
          arrange: 'a tree with a node_modules directory at the top and one below docs',
          act: 'the root path is listed as a scope skipping node_modules',
          assert: 'every file outside node_modules is listed and none inside',
        },
      },
      async () => {
        let harness: DirectoryHarness;
        let paths: string[];
        arrange: {
          harness = await setUp();
        }
        act: {
          paths = (
            await harness.directory.listScope(harness.root, {
              paths: ['.'],
              templateFolders: [],
              skipDirNames: ['node_modules'],
            })
          ).map((entry) => entry.path);
        }
        assert: {
          expect(paths[0]).toBe('.');
          expect(paths).toContain('a.md');
          expect(paths).toContain('docs/b.md');
          expect(paths.filter((path) => path.split('/').includes('node_modules'))).toEqual([]);
          await harness.cleanup();
        }
      },
    );
  });
};
