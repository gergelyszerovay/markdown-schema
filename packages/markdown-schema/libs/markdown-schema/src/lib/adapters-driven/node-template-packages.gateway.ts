import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { templateFolderName } from '../core/binding/template-folder-names.model.ts';
import type { ListedTemplatePackages } from '../core/listed-template-packages.model.ts';
import type { OpenedTemplatePackage } from '../core/opened-template-package.model.ts';
import type { TemplatePackagesPort } from '../core/template-packages.port.ts';

/** Directory names never entered inside a package. */
const skippedDirNames: readonly string[] = ['node_modules', 'dist'];

/** A package name, scoped or not: no `..`, no empty segment, at most one `/` after a scope. */
const packageNamePattern = /^(?:@[^/@\s]+\/)?[^/@\s.][^/\s]*$/;

/** A manifest, or why it could not be read. */
type Manifest =
  | { kind: 'read'; value: Record<string, unknown> }
  | { kind: 'missing' }
  | { kind: 'refused'; message: string };

/**
 * Reads and parses a `package.json`.
 * @param file - Absolute path of the manifest.
 * @returns Its object, `missing` when there is no file, or why it is unusable.
 */
async function readManifest(file: string): Promise<Manifest> {
  let text: string;
  try {
    text = await readFile(file, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { kind: 'missing' };
    return { kind: 'refused', message: `Error: cannot read ${file}: ${String(error)}` };
  }
  try {
    const value: unknown = JSON.parse(text);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return { kind: 'refused', message: `Error: ${file} does not hold a JSON object` };
    }
    return { kind: 'read', value: value as Record<string, unknown> };
  } catch (error) {
    return {
      kind: 'refused',
      message: `Error: cannot parse ${file}: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Tells whether a path is a directory itself, not a link to one.
 * @param absolute - The path.
 * @returns `true` for a real directory.
 */
async function isRealDirectory(absolute: string): Promise<boolean> {
  try {
    return (await lstat(absolute)).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Lists the files of one templates folder of a package: the files directly inside each
 * `<name>/` folder. A symbolic link (a linked folder or file) is not followed, and a skipped
 * name is not entered.
 * @param directory - Absolute path of the package.
 * @param folder - Package-relative POSIX path of the templates folder.
 * @param add - Receives each package-relative file path.
 * @returns Resolves when the folder is listed.
 */
async function listTemplatesFolder(
  directory: string,
  folder: string,
  add: (path: string) => void,
): Promise<void> {
  const absolute = path.join(directory, folder);
  if (!(await isRealDirectory(absolute))) return;
  for (const template of await readdir(absolute, { withFileTypes: true })) {
    if (!template.isDirectory() || skippedDirNames.includes(template.name)) continue;
    let children;
    try {
      children = await readdir(path.join(absolute, template.name), { withFileTypes: true });
    } catch {
      continue;
    }
    for (const child of children) {
      if (child.isFile()) add(path.posix.join(folder, template.name, child.name));
    }
  }
}

/**
 * Gets the package a dependency's spec installs: the target of an `npm:` alias, else the key.
 * @param key - The dependency's key.
 * @param spec - Its version spec, such as `^1.0.0` or `npm:@scope/name@^1`.
 * @returns The package name the installed manifest must carry.
 */
function declaredName(key: string, spec: string): string {
  if (!spec.startsWith('npm:')) return key;
  const target = spec.slice('npm:'.length);
  const at = target.lastIndexOf('@');
  return at > 0 ? target.slice(0, at) : target;
}

/**
 * Creates the file-system implementation of the template-packages port. The list is
 * `markdownSchema.templatePackages` of `<root>/package.json`. A package is
 * `<root>/node_modules/<key>`: that one path may be a symbolic link (pnpm's), and its real path is
 * the directory read; inside it no link is followed, `node_modules` and `dist` are not entered, and
 * only `markdown-schema-templates/<name>/` and `skills/<skill>/markdown-schema-templates/<name>/`
 * are listed (the files directly in each template folder), so a run reads no more of a package than
 * its templates.
 * @returns The adapter; it holds no state.
 * @failure `listed` refuses a `package.json` that cannot be read or parsed and a field that is not
 * a list of package names; `open` refuses a key that is no package name, a key the root does not
 * declare in `dependencies` or `devDependencies`, a package that is not installed, and an installed
 * manifest whose `name` is not the declared package (the alias's target for an alias). A template
 * folder that cannot be listed is left out.
 */
export function makeNodeTemplatePackages(): TemplatePackagesPort {
  return {
    async listed(root): Promise<ListedTemplatePackages> {
      const file = path.join(root, 'package.json');
      const manifest = await readManifest(file);
      if (manifest.kind === 'missing') return { kind: 'listed', keys: [] };
      if (manifest.kind === 'refused') return manifest;
      const field = manifest.value.markdownSchema;
      const list =
        typeof field === 'object' && field !== null && !Array.isArray(field)
          ? (field as Record<string, unknown>).templatePackages
          : field;
      if (list === undefined) return { kind: 'listed', keys: [] };
      if (
        !Array.isArray(list) ||
        !list.every((key): key is string => typeof key === 'string' && key !== '')
      ) {
        return {
          kind: 'refused',
          message: `Error: markdownSchema.templatePackages of ${file} must be a list of package names`,
        };
      }
      return { kind: 'listed', keys: [...new Set(list)] };
    },

    async open(root, key): Promise<OpenedTemplatePackage> {
      const file = path.join(root, 'package.json');
      if (!packageNamePattern.test(key) || key.split('/').includes('..')) {
        return { kind: 'refused', message: `Error: template package ${key} is not a package name` };
      }
      const manifest = await readManifest(file);
      if (manifest.kind === 'refused') return manifest;
      const declared = (field: string): unknown => {
        if (manifest.kind !== 'read') return undefined;
        const dependencies = manifest.value[field];
        return typeof dependencies === 'object' && dependencies !== null
          ? (dependencies as Record<string, unknown>)[key]
          : undefined;
      };
      const spec = declared('dependencies') ?? declared('devDependencies');
      if (typeof spec !== 'string') {
        return {
          kind: 'refused',
          message: `Error: template package ${key} is not declared in dependencies or devDependencies of ${file}`,
        };
      }
      const link = path.join(root, 'node_modules', ...key.split('/'));
      let directory: string;
      try {
        directory = await realpath(link);
        if (!(await lstat(directory)).isDirectory()) throw new Error('not a directory');
      } catch {
        return {
          kind: 'refused',
          message: `Error: template package ${key} is not installed: ${link} is missing; run the install`,
        };
      }
      const target = declaredName(key, spec);
      const installed = await readManifest(path.join(directory, 'package.json'));
      const name = installed.kind === 'read' ? installed.value.name : undefined;
      if (name !== target) {
        return {
          kind: 'refused',
          message: `Error: template package ${key}: ${link} is ${typeof name === 'string' ? name : 'no package'}, not ${target}`,
        };
      }

      const paths: string[] = [];
      const add = (relative: string): void => {
        paths.push(relative);
      };
      await listTemplatesFolder(directory, templateFolderName, add);
      const skills = path.join(directory, 'skills');
      if (await isRealDirectory(skills)) {
        for (const skill of await readdir(skills, { withFileTypes: true })) {
          if (!skill.isDirectory() || skippedDirNames.includes(skill.name)) continue;
          await listTemplatesFolder(
            directory,
            path.posix.join('skills', skill.name, templateFolderName),
            add,
          );
        }
      }
      paths.sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
      return { kind: 'opened', templatePackage: { package: key, paths }, directory };
    },
  };
}
