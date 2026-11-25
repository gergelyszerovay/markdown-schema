import type { RefineFunction } from '../core/refine-function.model.ts';
import type { RefineLoader } from '../core/refine-loader.port.ts';

/** A refine loader with companions a test arranges by template path, and a record of its calls. */
export type RefineLoaderFake = {
  loadRefine: RefineLoader;
  /** The template paths the loader was asked about, in order. */
  calls: string[];
  /** The template has a companion that exports this refine function. */
  givenRefine(templatePath: string, refine: RefineFunction): void;
  /** The template's companion fails to import with this error. */
  givenImportFailure(templatePath: string, error: Error): void;
};

/**
 * Creates a refine loader over companions arranged in memory: a template without one, or
 * whose companion exports no refine function, resolves `undefined`.
 * @returns The fake.
 */
export function makeRefineLoaderFake(): RefineLoaderFake {
  const companions = new Map<string, RefineFunction | Error>();
  const calls: string[] = [];
  return {
    calls,
    givenRefine: (templatePath, refine): void => {
      companions.set(templatePath, refine);
    },
    givenImportFailure: (templatePath, error): void => {
      companions.set(templatePath, error);
    },
    loadRefine: (templatePath: string): Promise<RefineFunction | undefined> => {
      calls.push(templatePath);
      const companion = companions.get(templatePath);
      return companion instanceof Error ? Promise.reject(companion) : Promise.resolve(companion);
    },
  };
}
