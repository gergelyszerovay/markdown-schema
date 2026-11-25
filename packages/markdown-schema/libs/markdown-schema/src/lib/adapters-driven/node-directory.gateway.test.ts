import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { directoryContract } from '../testing/directory.contract.ts';
import type { DirectoryHarness } from '../testing/directory.contract.ts';
import { makeNodeDirectory } from './node-directory.gateway.ts';

/**
 * Creates a temporary directory tree.
 * @param files - The files to write, by relative path.
 * @returns The real path of the directory.
 */
async function makeTree(files: Record<string, string>): Promise<string> {
  const dir = await realpath(await mkdtemp(join(tmpdir(), 'md-schema-directory-')));
  for (const [path, content] of Object.entries(files)) {
    await mkdir(join(dir, path, '..'), { recursive: true });
    await writeFile(join(dir, path), content, 'utf-8');
  }
  return dir;
}

directoryContract('node fs', async (): Promise<DirectoryHarness> => {
  const dir = await makeTree({
    'a.md': '# A\n',
    'docs/b.md': '# B\n',
    'node_modules/x/c.md': '# C\n',
    'docs/node_modules/d.md': '# D\n',
  });
  await symlink(join(dir, 'a.md'), join(dir, 'link.md'));
  return {
    directory: makeNodeDirectory({ cwd: dir }),
    root: dir,
    cleanup: () => rm(dir, { recursive: true, force: true }),
  };
});

describe('makeNodeDirectory locate', () => {
  it(
    'defaults the root to the nearest ancestor with a .git, a file counting too, and makes paths root-relative',
    {
      tags: ['scenario'],
      meta: {
        spec: 'directory-locate-defaults-to-the-git-root',
        arrange:
          'a worktree-like tree whose root holds a .git file and a working directory below it',
        act: 'paths are located from the nested working directory without a root',
        assert: 'the root is the directory with .git and the paths are relative to it',
      },
    },
    async () => {
      let dir: string;
      let located: Awaited<ReturnType<ReturnType<typeof makeNodeDirectory>['locate']>>;
      arrange: {
        dir = await makeTree({ '.git': 'gitdir: elsewhere\n', 'docs/deep/a.md': '# A\n' });
      }
      act: {
        located = await makeNodeDirectory({ cwd: join(dir, 'docs') }).locate({
          root: undefined,
          paths: ['deep', '.'],
        });
      }
      assert: {
        expect(located).toEqual({ kind: 'located', root: dir, paths: ['docs/deep', 'docs'] });
        await rm(dir, { recursive: true, force: true });
      }
    },
  );

  it(
    'refuses a path outside the root, a missing path and a root that is not a directory',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'directory-locate-refuses-unusable-input',
        arrange: 'a tree and a file outside it',
        act: 'paths and roots that do not fit are located',
        assert: 'each is refused with a message naming it',
      },
    },
    async () => {
      let dir: string;
      let outside: Awaited<ReturnType<ReturnType<typeof makeNodeDirectory>['locate']>>;
      let missing: typeof outside;
      let notDirectory: typeof outside;
      arrange: {
        dir = await makeTree({ 'root/a.md': '# A\n', 'other.md': '# O\n' });
      }
      act: {
        const directory = makeNodeDirectory({ cwd: dir });
        outside = await directory.locate({ root: 'root', paths: ['other.md'] });
        missing = await directory.locate({ root: 'root', paths: ['root/nope.md'] });
        notDirectory = await directory.locate({ root: 'other.md', paths: [] });
      }
      assert: {
        for (const [located, reason] of [
          [outside, 'outside the root'],
          [missing, 'does not exist'],
          [notDirectory, 'not a directory'],
        ] as const) {
          expect(located.kind).toBe('refused');
          expect(located.kind === 'refused' ? located.message : '').toContain(reason);
        }
        await rm(dir, { recursive: true, force: true });
      }
    },
  );
});

describe('makeNodeDirectory listScope', () => {
  it(
    'lists the requested file, the templates folders above it and the directory a template link points to, nothing else',
    {
      tags: ['scenario'],
      meta: {
        spec: 'directory-list-scope-follows-template-links-only',
        arrange:
          'a document below a folder whose templates folder links to a template kept elsewhere, and an unrelated file',
        act: 'the document is listed as a scope with the templates folders above it',
        assert:
          'the document, the link and the linked template files are listed, the unrelated file is not',
      },
    },
    async () => {
      let dir: string;
      let paths: string[];
      arrange: {
        dir = await makeTree({
          'skills/markdown-schema-templates/note/note.template.md': '# T\n',
          'skills/markdown-schema-templates/note/note.refine.ts': 'export default 1;\n',
          'skills/markdown-schema-templates/note/examples/ok.md': '# E\n',
          'app/docs/a.note.md': '# A\n',
          'other/b.md': '# B\n',
        });
        await mkdir(join(dir, 'app/markdown-schema-templates'));
        await symlink(
          join(dir, 'skills/markdown-schema-templates/note'),
          join(dir, 'app/markdown-schema-templates/note'),
        );
      }
      act: {
        paths = (
          await makeNodeDirectory({ cwd: dir }).listScope(dir, {
            paths: ['app/docs/a.note.md'],
            templateFolders: [
              'markdown-schema-templates',
              'app/markdown-schema-templates',
              'app/docs/markdown-schema-templates',
            ],
            skipDirNames: [],
          })
        ).map((entry) => entry.path);
      }
      assert: {
        expect(paths).toEqual([
          '.',
          'app/docs/a.note.md',
          'app/markdown-schema-templates',
          'app/markdown-schema-templates/note',
          'skills/markdown-schema-templates/note/note.refine.ts',
          'skills/markdown-schema-templates/note/note.template.md',
        ]);
        await rm(dir, { recursive: true, force: true });
      }
    },
  );

  it(
    'lists the files Git tracks or does not ignore for the root, leaving out ignored and deleted ones',
    {
      tags: ['scenario'],
      meta: {
        spec: 'directory-list-scope-root-uses-git',
        arrange:
          'a Git work tree with a staged file, an untracked file, an ignored folder and a staged file deleted from disk',
        act: 'the root is listed as a scope',
        assert:
          'the staged and untracked files are listed, with a template link as a link, and the ignored and deleted files are not',
      },
    },
    async () => {
      let dir: string;
      let entries: Awaited<ReturnType<ReturnType<typeof makeNodeDirectory>['listScope']>>;
      arrange: {
        dir = await makeTree({
          '.gitignore': 'ignored/\n',
          'a.md': '# A\n',
          'gone.md': '# G\n',
          'ignored/x.md': '# X\n',
          'docs/node_modules/skipped.md': '# S\n',
          'real/note/note.template.md': '# T\n',
        });
        await mkdir(join(dir, 'markdown-schema-templates'));
        await symlink(join(dir, 'real/note'), join(dir, 'markdown-schema-templates/note'));
        execFileSync('git', ['init', '-q'], { cwd: dir });
        execFileSync('git', ['add', '-A', '--', '.'], { cwd: dir });
        await writeFile(join(dir, 'new.md'), '# N\n', 'utf-8');
        await rm(join(dir, 'gone.md'));
      }
      act: {
        entries = await makeNodeDirectory({ cwd: dir }).listScope(dir, {
          paths: ['.'],
          templateFolders: [],
          skipDirNames: ['node_modules'],
        });
      }
      assert: {
        expect(entries.map((entry) => entry.path)).toEqual([
          '.',
          '.gitignore',
          'a.md',
          'markdown-schema-templates/note',
          'new.md',
          'real/note/note.template.md',
        ]);
        expect(entries.find((entry) => entry.path === 'markdown-schema-templates/note')).toEqual({
          path: 'markdown-schema-templates/note',
          kind: 'symlink',
          target: 'real/note',
        });
        await rm(dir, { recursive: true, force: true });
      }
    },
  );
});

describe('makeNodeDirectory listScope fallbacks', () => {
  it(
    'walks the disk for a root that is not the top of a work tree, even when an outer work tree ignores it',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'directory-list-scope-root-without-git-walks-disk',
        arrange: 'a Git work tree that ignores a folder, and a root inside that folder',
        act: 'the inner root is listed as a scope',
        assert: 'its files are listed, not nothing',
      },
    },
    async () => {
      let dir: string;
      let paths: string[];
      arrange: {
        dir = await makeTree({ '.gitignore': 'inner/\n', 'inner/a.md': '# A\n' });
        execFileSync('git', ['init', '-q'], { cwd: dir });
      }
      act: {
        paths = (
          await makeNodeDirectory({ cwd: join(dir, 'inner') }).listScope(join(dir, 'inner'), {
            paths: ['.'],
            templateFolders: [],
            skipDirNames: [],
          })
        ).map((entry) => entry.path);
      }
      assert: {
        expect(paths).toEqual(['.', 'a.md']);
        await rm(dir, { recursive: true, force: true });
      }
    },
  );

  it(
    'walks the disk when Git fails in a root that holds .git',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'directory-list-scope-git-failure-walks-disk',
        arrange: 'a root with a .git folder that is not a repository',
        act: 'the root is listed as a scope',
        assert: 'the files on disk are listed',
      },
    },
    async () => {
      let dir: string;
      let paths: string[];
      arrange: {
        dir = await makeTree({ '.git/HEAD': 'nonsense\n', 'a.md': '# A\n' });
      }
      act: {
        paths = (
          await makeNodeDirectory({ cwd: dir }).listScope(dir, {
            paths: ['.'],
            templateFolders: [],
            skipDirNames: ['.git'],
          })
        ).map((entry) => entry.path);
      }
      assert: {
        expect(paths).toEqual(['.', 'a.md']);
        await rm(dir, { recursive: true, force: true });
      }
    },
  );

  it(
    'does not read a template link target that sits behind a symbolic link or is itself a link',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'directory-list-scope-link-targets-stay-real',
        arrange:
          'template links, one to a directory behind a linked folder and one to a link to a directory',
        act: 'the templates folder is listed as a scope',
        assert: 'neither target contributes files',
      },
    },
    async () => {
      let dir: string;
      let paths: string[];
      arrange: {
        dir = await makeTree({
          'real/note/note.template.md': '# T\n',
          'real/other/other.template.md': '# T\n',
        });
        await symlink(join(dir, 'real'), join(dir, 'alias'));
        await symlink(join(dir, 'real/other'), join(dir, 'otherlink'));
        await mkdir(join(dir, 'markdown-schema-templates'));
        await symlink(join(dir, 'alias/note'), join(dir, 'markdown-schema-templates/note'));
        await symlink(join(dir, 'otherlink'), join(dir, 'markdown-schema-templates/other'));
      }
      act: {
        paths = (
          await makeNodeDirectory({ cwd: dir }).listScope(dir, {
            paths: ['markdown-schema-templates'],
            templateFolders: [],
            skipDirNames: [],
          })
        ).map((entry) => entry.path);
      }
      assert: {
        expect(paths).toEqual([
          '.',
          'markdown-schema-templates',
          'markdown-schema-templates/note',
          'markdown-schema-templates/other',
        ]);
        await rm(dir, { recursive: true, force: true });
      }
    },
  );
});
