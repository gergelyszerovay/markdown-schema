import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * Smoke tests of the `validate-md` binary, run through its `bin` entry: they run the product surface (argument
 * parsing, exit codes, stderr format, `--emit-json`, `--no-refine`, removed and unknown flags)
 * exactly as markdown-schema 0.3.0's CLI tests did. Skipped until `build` has produced the
 * binary (Turbo builds first).
 */
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/** The committed `bin` entry package managers link, which loads the built CLI. */
const bin = join(packageRoot, 'bin/validate-md.mjs');
/** The built CLI; the specs are skipped until it exists. */
const built = join(packageRoot, 'dist/validate-md.main.mjs');

type Context = {
  dir: string;
  run: (args: string[], cwd?: string) => { status: number | null; stderr: string; stdout: string };
};

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/**
 * Creates a temporary directory holding a template with a refine companion that rejects the
 * name `BAD`, and three documents: a valid one, one the refine rejects, and one that misses
 * the required section.
 * @returns The directory and a runner for the binary.
 */
function setUp(): Context {
  const dir = mkdtempSync(join(tmpdir(), 'md-schema-cli-'));
  dirs.push(dir);
  writeFileSync(
    join(dir, 't.template.md'),
    [
      '# Doc: <!-- TEMPLATE-ONLY: string; required -->',
      '',
      '## 1. Meta',
      '',
      '- Name: <!-- TEMPLATE-ONLY: string; required -->',
      '',
    ].join('\n'),
  );
  writeFileSync(
    join(dir, 't.refine.ts'),
    [
      'export const refine = (doc: any, ctx: any) => {',
      "  if (doc?.meta?.Name === 'BAD') {",
      "    ctx.addIssue({ code: 'custom', path: ['meta', 'Name'], message: 'Name must not be BAD' });",
      '  }',
      '};',
      '',
    ].join('\n'),
  );
  writeFileSync(join(dir, 'valid.md'), '# Doc: Widget\n\n## 1. Meta\n\n- Name: Good\n');
  writeFileSync(join(dir, 'refine-bad.md'), '# Doc: Widget\n\n## 1. Meta\n\n- Name: BAD\n');
  // Structural failure: the required Meta section is missing entirely.
  writeFileSync(join(dir, 'structural-bad.md'), '# Doc: Widget\n');
  return {
    dir,
    run: (args, cwd) => spawnSync('node', [bin, ...args], { encoding: 'utf-8', cwd }),
  };
}

describe.skipIf(!existsSync(built))('validate-md binary', () => {
  it(
    'exits 0 and prints OK for a valid document',
    {
      tags: ['scenario'],
      meta: {
        spec: 'binary-valid-document-prints-ok',
        arrange: 'a template and a document that satisfies it',
        act: 'validate-md validates the document against the template',
        assert: 'the exit code is 0 and stderr says the document is OK',
      },
    },
    () => {
      let context: Context;
      let result: ReturnType<Context['run']>;
      arrange: {
        context = setUp();
      }
      act: {
        result = context.run([
          '--template',
          join(context.dir, 't.template.md'),
          join(context.dir, 'valid.md'),
        ]);
      }
      assert: {
        expect(result.status).toBe(0);
        expect(result.stderr).toMatch(/valid\.md: OK/);
      }
    },
  );

  it(
    'exits 1 when the refine rejects the document',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'binary-refine-rejection-exits-1',
        arrange: 'a template whose refine companion rejects the name BAD, and a document named BAD',
        act: 'validate-md validates the document against the template',
        assert:
          'the exit code is 1 and stderr reports the failed validation and the refine message',
      },
    },
    () => {
      let context: Context;
      let result: ReturnType<Context['run']>;
      arrange: {
        context = setUp();
      }
      act: {
        result = context.run([
          '--template',
          join(context.dir, 't.template.md'),
          join(context.dir, 'refine-bad.md'),
        ]);
      }
      assert: {
        expect(result.status).toBe(1);
        expect(result.stderr).toMatch(/schema validation failed/);
        expect(result.stderr).toMatch(/Name must not be BAD/);
      }
    },
  );

  it(
    '--no-refine skips the refine so the same document passes',
    {
      tags: ['scenario'],
      meta: {
        spec: 'binary-no-refine-skips-the-refine',
        arrange: 'a template whose refine companion rejects the name BAD, and a document named BAD',
        act: 'validate-md validates the document with --no-refine',
        assert: 'the exit code is 0',
      },
    },
    () => {
      let context: Context;
      let result: ReturnType<Context['run']>;
      arrange: {
        context = setUp();
      }
      act: {
        result = context.run([
          '--template',
          join(context.dir, 't.template.md'),
          '--no-refine',
          join(context.dir, 'refine-bad.md'),
        ]);
      }
      assert: {
        expect(result.status).toBe(0);
      }
    },
  );

  it(
    '--emit-json writes the parsed JSON',
    {
      tags: ['scenario'],
      meta: {
        spec: 'binary-emit-json-writes-the-parsed-document',
        arrange: 'a template and a valid document',
        act: 'validate-md validates the document with --emit-json to a new file',
        assert: 'the exit code is 0 and the file holds the parsed document as JSON',
      },
    },
    () => {
      let context: Context;
      let out: string;
      let result: ReturnType<Context['run']>;
      arrange: {
        context = setUp();
        out = join(context.dir, 'out.json');
      }
      act: {
        result = context.run([
          '--template',
          join(context.dir, 't.template.md'),
          '--emit-json',
          out,
          join(context.dir, 'valid.md'),
        ]);
      }
      assert: {
        expect(result.status).toBe(0);
        const json = JSON.parse(readFileSync(out, 'utf-8')) as { meta: { Name: string } };
        expect(json.meta.Name).toBe('Good');
      }
    },
  );

  it(
    'prints a structural error as a single line (no Zod issue list)',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'binary-structural-error-is-one-line',
        arrange: 'a template and a document without the required Meta section',
        act: 'validate-md validates the document against the template',
        assert: 'the exit code is 1 and stderr names the missing section without an issue list',
      },
    },
    () => {
      let context: Context;
      let result: ReturnType<Context['run']>;
      arrange: {
        context = setUp();
      }
      act: {
        result = context.run([
          '--template',
          join(context.dir, 't.template.md'),
          join(context.dir, 'structural-bad.md'),
        ]);
      }
      assert: {
        expect(result.status).toBe(1);
        expect(result.stderr).toMatch(/Missing required section: "1\. Meta"/);
        expect(result.stderr).not.toMatch(/schema validation failed/);
      }
    },
  );

  it(
    'errors on the removed --schema flag',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'binary-removed-schema-flag-errors',
        arrange: 'a document to validate',
        act: 'validate-md runs with the removed --schema flag',
        assert: 'the exit code is 1 and stderr says the flag was removed in v0.2.0',
      },
    },
    () => {
      let context: Context;
      let result: ReturnType<Context['run']>;
      arrange: {
        context = setUp();
      }
      act: {
        result = context.run(['--schema', 'x', join(context.dir, 'valid.md')]);
      }
      assert: {
        expect(result.status).toBe(1);
        expect(result.stderr).toMatch(/removed in v0\.2\.0/);
      }
    },
  );

  it(
    'errors on an unknown flag',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'binary-unknown-flag-errors',
        arrange: 'a template and a document',
        act: 'validate-md runs with a misspelled flag, --no-refin',
        assert: 'the exit code is 1 and stderr names the unknown option',
      },
    },
    () => {
      let context: Context;
      let result: ReturnType<Context['run']>;
      arrange: {
        context = setUp();
      }
      act: {
        result = context.run([
          '--template',
          join(context.dir, 't.template.md'),
          '--no-refin',
          join(context.dir, 'valid.md'),
        ]);
      }
      assert: {
        expect(result.status).toBe(1);
        expect(result.stderr).toMatch(/unknown option '--no-refin'/);
      }
    },
  );

  it(
    'errors when --template has no value',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'binary-template-flag-without-value-errors',
        arrange: 'no template file on the command line',
        act: 'validate-md runs with --template as its only argument',
        assert: 'the exit code is 1 and stderr says --template requires a value',
      },
    },
    () => {
      let context: Context;
      let result: ReturnType<Context['run']>;
      arrange: {
        context = setUp();
      }
      act: {
        result = context.run(['--template']);
      }
      assert: {
        expect(result.status).toBe(1);
        expect(result.stderr).toMatch(/--template requires a value/);
      }
    },
  );

  it(
    'runs in directory mode when there is no --template',
    {
      tags: ['scenario'],
      meta: {
        spec: 'binary-no-template-runs-directory-mode',
        arrange: 'a directory without a template holding a document, and no --template flag',
        act: 'validate-md runs from that directory with the document only',
        assert: 'the exit code is 0 and stderr summarises a run with no bound documents',
      },
    },
    () => {
      let context: Context;
      let result: ReturnType<Context['run']>;
      arrange: {
        context = setUp();
      }
      act: {
        result = context.run(['valid.md'], context.dir);
      }
      assert: {
        expect(result.status).toBe(0);
        expect(result.stderr).toMatch(/0 documents: 0 OK, 0 failed; 0 ambiguous; 1 unbound/);
      }
    },
  );
});

/**
 * Creates a temporary tree with a `.git` marker, a `note` template, a valid and an invalid
 * document named for it, a note under a directory to ignore, and a file no template claims.
 * @param extra - More files to write, by root-relative path.
 * @returns The directory and a runner for the binary.
 */
function setUpTree(extra: Record<string, string> = {}): Context {
  const context = setUp();
  const files: Record<string, string> = {
    '.git': 'gitdir: elsewhere\n',
    'markdown-schema-templates/note/note.template.md': [
      '# Note: <!-- TEMPLATE-ONLY: string; required -->',
      '',
      '## 1. Meta',
      '',
      '- Name: <!-- TEMPLATE-ONLY: string; required -->',
      '',
    ].join('\n'),
    'docs/good.note.md': '# Note: Widget\n\n## 1. Meta\n\n- Name: Good\n',
    'docs/bad.note.md': '# Note: Widget\n',
    'vendor/skipped.note.md': '# Note: Widget\n',
    'docs/loose.md': '# Loose\n',
    ...extra,
  };
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(context.dir, path)), { recursive: true });
    writeFileSync(join(context.dir, path), content);
  }
  return context;
}

describe.skipIf(!existsSync(built))('validate-md binary in directory mode', () => {
  it(
    'validates every bound document under the path, reports each, and exits 1 when one fails',
    {
      tags: ['scenario'],
      meta: {
        spec: 'binary-directory-mode-reports-each-document',
        arrange: 'a tree with a template, a valid and an invalid document, and a loose file',
        act: 'validate-md runs from inside the tree on a directory, ignoring vendor',
        assert:
          'stderr has an OK line, the failure, and the summary, the exit code is 1, and the ignored file is not mentioned',
      },
    },
    () => {
      let context: Context;
      let result: ReturnType<Context['run']>;
      arrange: {
        context = setUpTree();
      }
      act: {
        result = context.run(['--ignore', 'vendor', '.'], join(context.dir, 'docs'));
      }
      assert: {
        expect(result.status).toBe(1);
        expect(result.stderr).toMatch(/docs\/good\.note\.md: OK/);
        expect(result.stderr).toMatch(/docs\/bad\.note\.md: Missing required section/);
        expect(result.stderr).toMatch(/2 documents: 1 OK, 1 failed; 0 ambiguous; 1 unbound/);
        expect(result.stderr).not.toMatch(/vendor/);
      }
    },
  );

  it(
    'exits 0 when everything bound validates, and lists unbound files with --verbose',
    {
      tags: ['scenario'],
      meta: {
        spec: 'binary-directory-mode-exits-0-when-valid',
        arrange: 'a tree with a template, one valid document and a loose file',
        act: 'validate-md validates the one valid document, then the directory with --verbose',
        assert: 'the first exits 0 and the second lists the loose file as unbound',
      },
    },
    () => {
      let context: Context;
      let one: ReturnType<Context['run']>;
      let verbose: ReturnType<Context['run']>;
      arrange: {
        context = setUpTree();
      }
      act: {
        one = context.run(['docs/good.note.md'], context.dir);
        verbose = context.run(['docs/loose.md', '--verbose'], context.dir);
      }
      assert: {
        expect(one.status).toBe(0);
        expect(one.stderr).toMatch(/1 documents: 1 OK, 0 failed/);
        expect(verbose.status).toBe(0);
        expect(verbose.stderr).toMatch(/docs\/loose\.md: unbound/);
      }
    },
  );

  it(
    'reports a template that does not compile and its documents, and exits 1',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'binary-directory-mode-reports-broken-templates',
        arrange: 'a tree with a broken template and a document bound to it',
        act: 'validate-md runs on the document',
        assert:
          'stderr names the broken template and the not validated document, and the exit code is 1',
      },
    },
    () => {
      let context: Context;
      let result: ReturnType<Context['run']>;
      arrange: {
        context = setUpTree({
          'markdown-schema-templates/broken/broken.template.md':
            '# T <!-- TEMPLATE-ONLY: bogus -->\n',
          'docs/y.broken.md': '# Y\n',
        });
      }
      act: {
        result = context.run(['docs/y.broken.md'], context.dir);
      }
      assert: {
        expect(result.status).toBe(1);
        expect(result.stderr).toMatch(
          /invalid template markdown-schema-templates\/broken\/broken\.template\.md/,
        );
        expect(result.stderr).toMatch(/docs\/y\.broken\.md: its template .* did not compile/);
      }
    },
  );

  it(
    'binds documents to templates shared through a folder of relative symlinks',
    {
      tags: ['scenario'],
      meta: {
        spec: 'binary-directory-mode-binds-through-template-links',
        arrange:
          'a template in a skill folder, a folder of links to it beside some documents, and a document that would otherwise find no template',
        act: 'validate-md validates the document',
        assert: 'the document is bound to the template through the link, validated and OK',
      },
    },
    () => {
      let context: Context;
      let result: ReturnType<Context['run']>;
      arrange: {
        context = setUpTree({
          'skills/x/markdown-schema-templates/memo/memo.template.md':
            '# Memo: <!-- TEMPLATE-ONLY: string; required -->\n',
          'app/docs/1.thing.memo.md': '# Memo: Thing\n',
        });
        mkdirSync(join(context.dir, 'app/markdown-schema-templates'), { recursive: true });
        symlinkSync(
          '../../skills/x/markdown-schema-templates/memo',
          join(context.dir, 'app/markdown-schema-templates/memo'),
        );
      }
      act: {
        result = context.run(['app/docs'], context.dir);
      }
      assert: {
        expect(result.status).toBe(0);
        expect(result.stderr).toMatch(/app\/docs\/1\.thing\.memo\.md: OK/);
      }
    },
  );

  it(
    'warns of a template link whose way to the template crosses a symbolic link, in the output and in --json',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'binary-directory-mode-warns-of-unread-template-links',
        arrange:
          'a template in a skill folder reached through a linked skill folder, a catalog link through that link, and a document asking for it',
        act: 'validate-md validates the documents, then again with --json',
        assert:
          'the run names the link in a warning and in unreadTemplateLinks, the document stays unbound and the exit code is 0',
      },
    },
    () => {
      let context: Context;
      let result: ReturnType<Context['run']>;
      let json: ReturnType<Context['run']>;
      arrange: {
        context = setUpTree({
          'skills/x/markdown-schema-templates/memo/memo.template.md':
            '# Memo: <!-- TEMPLATE-ONLY: string; required -->\n',
          'app/docs/1.thing.memo.md': '# Memo: Thing\n',
        });
        mkdirSync(join(context.dir, '.claude/skills'), { recursive: true });
        symlinkSync('../../skills/x', join(context.dir, '.claude/skills/x'));
        mkdirSync(join(context.dir, 'app/markdown-schema-templates'), { recursive: true });
        symlinkSync(
          '../../.claude/skills/x/markdown-schema-templates/memo',
          join(context.dir, 'app/markdown-schema-templates/memo'),
        );
      }
      act: {
        result = context.run(['app/docs'], context.dir);
        json = context.run(['app/docs', '--json'], context.dir);
      }
      assert: {
        expect(result.status).toBe(0);
        expect(result.stderr).toContain(
          'Warning: template link app/markdown-schema-templates/memo -> .claude/skills/x/markdown-schema-templates/memo: no memo.template.md could be read there',
        );
        expect(result.stderr).toMatch(/0 documents: 0 OK, 0 failed; 0 ambiguous; 1 unbound/);
        expect(json.status).toBe(0);
        expect(
          (JSON.parse(json.stdout) as { unreadTemplateLinks: unknown }).unreadTemplateLinks,
        ).toEqual([
          {
            path: 'app/markdown-schema-templates/memo',
            name: 'memo',
            target: '.claude/skills/x/markdown-schema-templates/memo',
          },
        ]);
      }
    },
  );

  it(
    'refuses a path outside the root',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'binary-directory-mode-refuses-paths-outside-the-root',
        arrange: 'a tree with a .git marker and a path beside it',
        act: 'validate-md runs on the path outside the root',
        assert: 'the exit code is 1 and stderr says the path is outside the root',
      },
    },
    () => {
      let context: Context;
      let result: ReturnType<Context['run']>;
      arrange: {
        context = setUpTree();
      }
      act: {
        result = context.run(['..'], context.dir);
      }
      assert: {
        expect(result.status).toBe(1);
        expect(result.stderr).toMatch(/outside the root/);
      }
    },
  );
});

describe.skipIf(!existsSync(built))('validate-md binary with template packages', () => {
  const memoTemplate = [
    '# Memo: <!-- TEMPLATE-ONLY: string; required -->',
    '',
    '## 1. Meta',
    '',
    '- Name: <!-- TEMPLATE-ONLY: string; required -->',
    '',
  ].join('\n');
  const memoRefine = [
    'export const refine = (doc, ctx) => {',
    "  if (doc?.meta?.Name === 'BAD') {",
    "    ctx.addIssue({ code: 'custom', path: ['meta', 'Name'], message: 'Name must not be BAD' });",
    '  }',
    '};',
    '',
  ].join('\n');
  const inPackage = 'skills/x/markdown-schema-templates/memo';
  const printed = `@acme/templates/${inPackage}/memo.template.md`;

  /**
   * A tree whose root declares `@acme/templates`, installed in `node_modules` with a `memo`
   * template and a `.refine.js` that rejects the name `BAD`, and two memos.
   * @param manifest - The root `package.json`.
   * @returns The context.
   */
  const setUpPackages = (manifest: object): Context =>
    setUpTree({
      'package.json': JSON.stringify(manifest),
      'node_modules/@acme/templates/package.json': JSON.stringify({ name: '@acme/templates' }),
      [`node_modules/@acme/templates/${inPackage}/memo.template.md`]: memoTemplate,
      [`node_modules/@acme/templates/${inPackage}/memo.refine.js`]: memoRefine,
      'memos/good.memo.md': '# Memo: Widget\n\n## 1. Meta\n\n- Name: Good\n',
      'memos/bad.memo.md': '# Memo: Widget\n\n## 1. Meta\n\n- Name: BAD\n',
    });

  it(
    "validates against a listed package's templates, printing `<key>/<path>` in text and in `--json`",
    {
      tags: ['scenario'],
      meta: {
        spec: 'binary-template-packages-bind-and-print-the-key',
        arrange:
          'a root whose package.json declares and lists a package installed in node_modules, with a template and a `.refine.js` that rejects `BAD`',
        act: 'validate-md validates the tree, then again with `--json`',
        assert:
          'the good document is OK, the bad one fails the refine, and every template path starts with the key',
      },
    },
    () => {
      let context: Context;
      let result: ReturnType<Context['run']>;
      let json: ReturnType<Context['run']>;
      arrange: {
        context = setUpPackages({
          devDependencies: { '@acme/templates': '^1.0.0' },
          markdownSchema: { templatePackages: ['@acme/templates'] },
        });
      }
      act: {
        result = context.run(['memos'], context.dir);
        json = context.run(['memos', '--json'], context.dir);
      }
      assert: {
        expect(result.status).toBe(1);
        expect(result.stderr).toContain('memos/good.memo.md: OK');
        expect(result.stderr).toContain('memos/bad.memo.md: schema validation failed');
        expect(result.stderr).toContain('Name must not be BAD');
        expect(result.stderr).toMatch(/2 documents: 1 OK, 1 failed; 0 ambiguous; 0 unbound/);
        expect(result.stderr).not.toContain('.pnpm');
        expect(
          (JSON.parse(json.stdout) as { documents: { templatePath: string }[] }).documents.map(
            (document) => document.templatePath,
          ),
        ).toEqual([printed, printed]);
      }
    },
  );

  it(
    'a listed name the root does not declare is a usage error naming it',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'binary-template-packages-undeclared-name-is-an-error',
        arrange: 'a root whose package.json lists a package it does not declare',
        act: 'validate-md validates the tree',
        assert: 'the exit code is 1 and stderr names the package',
      },
    },
    () => {
      let context: Context;
      let result: ReturnType<Context['run']>;
      arrange: {
        context = setUpPackages({ markdownSchema: { templatePackages: ['@acme/templates'] } });
      }
      act: {
        result = context.run(['memos'], context.dir);
      }
      assert: {
        expect(result.status).toBe(1);
        expect(result.stderr).toMatch(
          /template package @acme\/templates is not declared in dependencies or devDependencies/,
        );
      }
    },
  );

  it(
    '`--template-package` adds a package for one run, and `--no-template-packages` reads none',
    {
      tags: ['scenario'],
      meta: {
        spec: 'binary-template-packages-flags',
        arrange:
          'a root that declares a package with a template but does not list it, and a document named for it',
        act: 'validate-md runs with `--template-package`, then with that flag and `--no-template-packages`',
        assert: 'the first run binds the document; the second leaves it unbound',
      },
    },
    () => {
      let context: Context;
      let added: ReturnType<Context['run']>;
      let none: ReturnType<Context['run']>;
      arrange: {
        context = setUpPackages({ devDependencies: { '@acme/templates': '^1.0.0' } });
      }
      act: {
        added = context.run(
          ['memos/good.memo.md', '--template-package', '@acme/templates'],
          context.dir,
        );
        none = context.run(
          ['memos/good.memo.md', '--template-package', '@acme/templates', '--no-template-packages'],
          context.dir,
        );
      }
      assert: {
        expect(added.status).toBe(0);
        expect(added.stderr).toMatch(/1 documents: 1 OK, 0 failed; 0 ambiguous; 0 unbound/);
        expect(none.status).toBe(0);
        expect(none.stderr).toMatch(/0 documents: 0 OK, 0 failed; 0 ambiguous; 1 unbound/);
      }
    },
  );
});
