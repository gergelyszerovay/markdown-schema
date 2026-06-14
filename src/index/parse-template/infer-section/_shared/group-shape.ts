import type { Extractor } from "../../../_shared/extractor";

/** A map of sub-section keys to their extractors, used by repeating-group helpers. */
export type GroupShape = Record<string, Extractor<unknown>>;
