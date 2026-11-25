import type { RootContent } from 'mdast';
import type { Extractor } from './extractor.model.ts';

/**
 * Returns the raw mdast nodes for a section unchanged.
 *
 * This is an escape hatch for when none of the built-in extractors fit.
 * @param nodes - The mdast nodes belonging to the section body.
 * @returns The same `nodes` array passed in.
 */
export const rawNodes: Extractor<RootContent[]> = (nodes) => nodes;
