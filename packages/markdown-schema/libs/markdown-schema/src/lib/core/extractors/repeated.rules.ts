import { toString } from 'mdast-util-to-string';
import type { Heading } from 'mdast';
import type { Extractor } from './extractor.model.ts';
import type { GroupShape } from './group-shape.model.ts';
import type { GroupResult } from './group-result.model.ts';
import { repeatedWhere } from './repeated-where.rules.ts';

/**
 * Splits a section by sub-heading depth and runs sub-extractors on each group.
 *
 * When `opts.by` is omitted the depth is auto-detected from the first
 * sub-heading encountered and all subsequent group boundaries are pinned to
 * that same depth. Deeper or shallower headings are treated as body content.
 * Pin `opts.by` explicitly when your convention matters.
 * @param opts - Configuration for the repeating groups. `by`: expected heading depth (e.g. `3` for H3). Auto-detected from the first sub-heading when omitted. `shape`: map of output key → extractor applied to each group's body.
 * @returns An extractor that yields an array of {@link GroupResult} objects.
 */
export function repeated<S extends GroupShape>(opts: {
  by?: number;
  shape: S;
}): Extractor<GroupResult<S>[]> {
  return (nodes, ctx) => {
    let depth = opts.by;
    return repeatedWhere({
      startsAt: (n): n is Heading => {
        if (n.type !== 'heading') return false;
        depth ??= n.depth;
        return n.depth === depth;
      },
      headingFrom: (n) => toString(n).trim(),
      shape: opts.shape,
      includeBoundary: false,
    })(nodes, ctx);
  };
}
