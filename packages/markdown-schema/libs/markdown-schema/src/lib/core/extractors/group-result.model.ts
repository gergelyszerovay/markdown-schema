import type { Extractor } from './extractor.model.ts';
import type { GroupShape } from './group-shape.model.ts';

/**
 * The result object produced for each group by {@link repeatedWhere} or
 * {@link repeated}. Contains the group heading plus every key from `S` mapped
 * to its extracted value.
 */
export type GroupResult<S extends GroupShape> = { heading: string } & {
  [K in keyof S]: S[K] extends Extractor<infer T> ? T : never;
};
