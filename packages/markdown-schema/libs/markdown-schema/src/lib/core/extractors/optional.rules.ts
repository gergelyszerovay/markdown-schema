import type { Extractor } from './extractor.model.ts';

/**
 * Wraps an extractor so that when it throws (e.g. a required element is
 * missing) the wrapped extractor returns `undefined` instead.
 * @param ex - The extractor to make optional.
 * @returns A new extractor that returns `T | undefined`.
 */
export const optional =
  <T>(ex: Extractor<T>): Extractor<T | undefined> =>
  (nodes, ctx) => {
    try {
      return ex(nodes, ctx);
    } catch {
      return undefined;
    }
  };
