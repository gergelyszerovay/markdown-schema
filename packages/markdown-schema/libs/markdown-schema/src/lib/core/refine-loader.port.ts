import type { RefineFunction } from './refine-function.model.ts';

/**
 * Secondary port that finds the `refine` function of a template's companion `<stem>.refine.ts`
 * (or compiled `<stem>.refine.js` or `<stem>.refine.mjs`) file, so the use cases never read the file system or import code themselves. The path is
 * the template's own path (`<stem>.template.md`), resolved against the working directory when
 * relative.
 * @failure Resolves `undefined` when there is no companion file, or it exports no `refine`
 * function. A companion file that fails to load rejects with the import error, unchanged.
 */
export type RefineLoader = (templatePath: string) => Promise<RefineFunction | undefined>;
