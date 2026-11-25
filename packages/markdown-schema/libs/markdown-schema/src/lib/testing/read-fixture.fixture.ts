import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { RefineFunction } from '../core/refine-function.model.ts';

/**
 *
 */
const here = dirname(fileURLToPath(import.meta.url));
/**
 *
 */
const fixturesDir = join(here, 'fixtures');
/**
 *
 */
const examplesDir = resolve(here, '../../../../../examples');

/**
 * Reads a test fixture from the lib's `testing/fixtures` folder.
 * @param name - The fixture's path below `testing/fixtures`.
 * @returns The file's UTF-8 contents.
 */
export function readFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), 'utf-8');
}

/**
 * Reads a file from the package's `examples` folder.
 * @param name - The file's path below `examples`.
 * @returns The file's UTF-8 contents.
 */
export function readExample(name: string): string {
  return readFileSync(join(examplesDir, name), 'utf-8');
}

/**
 * Loads the `refine` export of an example's companion file, the way `loadRefine` does.
 * @param name - The example's path below `examples`, without the `.refine.ts` extension.
 * @returns The example's refine function.
 */
export async function loadExampleRefine(name: string): Promise<RefineFunction> {
  const module = (await import(pathToFileURL(join(examplesDir, `${name}.refine.ts`)).href)) as {
    refine: RefineFunction;
  };
  return module.refine;
}
