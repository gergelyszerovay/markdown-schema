import type { Extractor } from './extractor.model.ts';

/** A map of sub-section keys to their extractors, used by repeating-group helpers. */
export type GroupShape = Record<string, Extractor<unknown>>;
