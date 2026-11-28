import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { ListedTemplatePackages } from '../core/listed-template-packages.model.ts';
import type { OpenedTemplatePackage } from '../core/opened-template-package.model.ts';
import { makeNodeTemplatePackages } from './node-template-packages.gateway.ts';

const dirs: string[] = [];

afterEach(async () => {
  for (const dir of dirs.splice(0)) await rm(dir, { recursive: true, force: true });
});

/**
 * Creates a temporary directory tree, removed after the spec.
 * @param files - The files to write, by relative path; an object is written as JSON.
 * @returns The real path of the directory.
 */
async function makeTree(files: Record<string, string | object>): Promise<string> {
  const dir = await realpath(await mkdtemp(join(tmpdir(), 'md-schema-packages-')));
  dirs.push(dir);
  for (const [path, content] of Object.entries(files)) {
    await mkdir(join(dir, path, '..'), { recursive: true });
    await writeFile(
      join(dir, path),
      typeof content === 'string' ? content : JSON.stringify(content),
      'utf-8',
    );
  }
  return dir;
}

const template = '# Note: <!-- TEMPLATE-ONLY: string; required -->\n';

describe('makeNodeTemplatePackages listed', () => {
  it(
    'reads `markdownSchema.templatePackages` of the root manifest, and none without it',
    {
      tags: ['scenario'],
      meta: {
        spec: 'template-packages-reads-the-list',
        arrange: 'a root manifest with the field, one without it, and a root without a manifest',
        act: 'the list of each root is read',
        assert: 'the first gives its keys in order, the other two an empty list',
      },
    },
    async () => {
      let roots: string[];
      let results: ListedTemplatePackages[];
      arrange: {
        roots = [
          await makeTree({
            'package.json': { markdownSchema: { templatePackages: ['b-templates', '@a/t'] } },
          }),
          await makeTree({ 'package.json': { name: 'x', markdownSchema: {} } }),
          await makeTree({ 'a.md': '# A\n' }),
        ];
      }
      act: {
        results = await Promise.all(roots.map((root) => makeNodeTemplatePackages().listed(root)));
      }
      assert: {
        expect(results).toEqual([
          { kind: 'listed', keys: ['b-templates', '@a/t'] },
          { kind: 'listed', keys: [] },
          { kind: 'listed', keys: [] },
        ]);
      }
    },
  );

  it(
    'refuses a field that is not a list of names',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'template-packages-refuses-a-malformed-list',
        arrange: 'a root manifest whose field is a string, and one whose list holds a number',
        act: 'the list of each root is read',
        assert: 'each is refused with a message naming the field',
      },
    },
    async () => {
      let roots: string[];
      let results: ListedTemplatePackages[];
      arrange: {
        roots = [
          await makeTree({ 'package.json': { markdownSchema: { templatePackages: 'a' } } }),
          await makeTree({ 'package.json': { markdownSchema: { templatePackages: ['a', 1] } } }),
        ];
      }
      act: {
        results = await Promise.all(roots.map((root) => makeNodeTemplatePackages().listed(root)));
      }
      assert: {
        for (const result of results) {
          expect(result).toEqual({
            kind: 'refused',
            message: expect.stringContaining('markdownSchema.templatePackages') as unknown,
          });
        }
      }
    },
  );
});

describe('makeNodeTemplatePackages open', () => {
  it(
    'a listed name the root does not declare, or that is not installed, is a usage error naming it',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'template-packages-refuses-an-undeclared-or-missing-package',
        arrange:
          'a root that declares one package it has not installed, and lists another it does not declare',
        act: 'each key is opened',
        assert: 'each is refused with a message naming the key and the root manifest',
      },
    },
    async () => {
      let root: string;
      let missing: OpenedTemplatePackage;
      let undeclared: OpenedTemplatePackage;
      arrange: {
        root = await makeTree({
          'package.json': { devDependencies: { '@acme/templates': '^1.0.0' } },
          'node_modules/other/package.json': { name: 'other' },
        });
      }
      act: {
        missing = await makeNodeTemplatePackages().open(root, '@acme/templates');
        undeclared = await makeNodeTemplatePackages().open(root, 'other');
      }
      assert: {
        expect(missing).toEqual({
          kind: 'refused',
          message: `Error: template package @acme/templates is not installed: ${join(root, 'node_modules/@acme/templates')} is missing; run the install`,
        });
        expect(undeclared).toEqual({
          kind: 'refused',
          message: `Error: template package other is not declared in dependencies or devDependencies of ${join(root, 'package.json')}`,
        });
      }
    },
  );

  it(
    'an alias is listed by its key and its installed manifest must name the target',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'template-packages-alias-manifest-names-the-target',
        arrange:
          'a root declaring the alias `templates` as `npm:@acme/templates@^1`, installed once with that name and once with another',
        act: 'the key `templates` is opened in each root',
        assert: 'the first opens the package; the second is refused naming both names',
      },
    },
    async () => {
      let good: string;
      let bad: string;
      let opened: OpenedTemplatePackage;
      let refused: OpenedTemplatePackage;
      arrange: {
        const manifest = { dependencies: { templates: 'npm:@acme/templates@^1' } };
        good = await makeTree({
          'package.json': manifest,
          'node_modules/templates/package.json': { name: '@acme/templates' },
          'node_modules/templates/markdown-schema-templates/note/note.template.md': template,
        });
        bad = await makeTree({
          'package.json': manifest,
          'node_modules/templates/package.json': { name: 'templates' },
        });
      }
      act: {
        opened = await makeNodeTemplatePackages().open(good, 'templates');
        refused = await makeNodeTemplatePackages().open(bad, 'templates');
      }
      assert: {
        expect(opened).toEqual({
          kind: 'opened',
          templatePackage: {
            package: 'templates',
            paths: ['markdown-schema-templates/note/note.template.md'],
          },
          directory: join(good, 'node_modules/templates'),
        });
        expect(refused).toEqual({
          kind: 'refused',
          message: `Error: template package templates: ${join(bad, 'node_modules/templates')} is templates, not @acme/templates`,
        });
      }
    },
  );

  it(
    '`node_modules/<key>` may be a link; a link inside the package is not followed',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'template-packages-follows-only-the-package-link',
        arrange:
          'a package installed as a link to a store folder, holding one template and links to a template folder and a skill elsewhere',
        act: 'the package is opened',
        assert:
          'its directory is the real path of the store folder and only the template that is not behind a link is listed',
      },
    },
    async () => {
      let root: string;
      let opened: OpenedTemplatePackage;
      arrange: {
        root = await makeTree({
          'package.json': { devDependencies: { '@acme/templates': '^1.0.0' } },
          'store/acme/package.json': { name: '@acme/templates' },
          'store/acme/skills/a/markdown-schema-templates/note/note.template.md': template,
          'elsewhere/plan/plan.template.md': template,
          'elsewhere/skill/markdown-schema-templates/memo/memo.template.md': template,
        });
        await mkdir(join(root, 'node_modules/@acme'), { recursive: true });
        await symlink(join(root, 'store/acme'), join(root, 'node_modules/@acme/templates'));
        await symlink(
          join(root, 'elsewhere/plan'),
          join(root, 'store/acme/skills/a/markdown-schema-templates/plan'),
        );
        await symlink(join(root, 'elsewhere/skill'), join(root, 'store/acme/skills/linked'));
      }
      act: {
        opened = await makeNodeTemplatePackages().open(root, '@acme/templates');
      }
      assert: {
        expect(opened).toEqual({
          kind: 'opened',
          templatePackage: {
            package: '@acme/templates',
            paths: ['skills/a/markdown-schema-templates/note/note.template.md'],
          },
          directory: join(root, 'store/acme'),
        });
      }
    },
  );

  it(
    "only the package's template folders are listed",
    { tags: ['invariant'], meta: { spec: 'template-packages-lists-only-template-folders' } },
    async () => {
      const root = await makeTree({
        'package.json': { devDependencies: { t: '1.0.0' } },
        'node_modules/t/package.json': { name: 't' },
        'node_modules/t/README.md': '# T\n',
        'node_modules/t/markdown-schema-templates/note/note.template.md': template,
        'node_modules/t/markdown-schema-templates/note/note.refine.js': 'export {};\n',
        'node_modules/t/markdown-schema-templates/note/examples/a.md': '# Note: A\n',
        'node_modules/t/layered-doc-templates/old/old.template.md': template,
        'node_modules/t/docs/markdown-schema-templates/deep/deep.template.md': template,
        'node_modules/t/skills/s/SKILL.md': '# S\n',
        'node_modules/t/skills/s/markdown-schema-templates/plan/plan.template.md': template,
        'node_modules/t/skills/s/node_modules/x/markdown-schema-templates/y/y.template.md':
          template,
        'node_modules/t/node_modules/dep/markdown-schema-templates/z/z.template.md': template,
      });
      const opened = await makeNodeTemplatePackages().open(root, 't');
      expect(opened.kind === 'opened' ? opened.templatePackage.paths : opened).toEqual([
        'markdown-schema-templates/note/note.refine.js',
        'markdown-schema-templates/note/note.template.md',
        'skills/s/markdown-schema-templates/plan/plan.template.md',
      ]);
    },
  );
});
