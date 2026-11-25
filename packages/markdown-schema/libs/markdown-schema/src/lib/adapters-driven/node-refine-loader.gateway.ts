import { existsSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { RefineFunction } from '../core/refine-function.model.ts';
import type { RefineLoader } from '../core/refine-loader.port.ts';

/**
 * Looks for a `<stem>.refine.ts` file next to the template, else a `<stem>.refine.js` one, and, if
 * found, dynamically imports its `refine` named export.
 *
 * The file is loaded with a plain `import()` call: Node 24 strips TypeScript types
 * natively, so no `tsx` wrapper is needed at runtime. Node refuses to strip types of a file under
 * `node_modules`, so a package that ships templates ships the compiled `.refine.js` instead.
 * @param templatePath - Absolute path to the `*.template.md` file.
 * @returns The `refine` function, or `undefined` if no companion file exists.
 * @failure A companion file that fails to import rejects with the import error, unchanged. A
 * missing file, or one without a `refine` function export, resolves `undefined`.
 */
export const loadRefine: RefineLoader = async (
  templatePath: string,
): Promise<RefineFunction | undefined> => {
  const dir = dirname(templatePath);
  const stemBase = basename(templatePath).replace(/\.template\.md$/, '');
  const fullPath = ['ts', 'js']
    .map((extension) => resolve(dir, `${stemBase}.refine.${extension}`))
    .find((candidate) => existsSync(candidate));

  if (fullPath === undefined) return undefined;

  const mod = (await import(pathToFileURL(fullPath).href)) as Record<string, unknown>;
  const fn = mod.refine;
  if (typeof fn !== 'function') return undefined;
  return fn as RefineFunction;
};
