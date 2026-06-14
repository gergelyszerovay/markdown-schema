import { toString } from "mdast-util-to-string";
import type { RootContent } from "mdast";
import type { Extractor } from "../../../_shared/extractor";
import type { GroupShape } from "../_shared/group-shape";
import type { GroupResult } from "../_shared/group-result";

/**
 * Generic repeating-group extractor that splits section nodes into groups
 * using an arbitrary predicate.
 *
 * Useful when groups are separated by anything other than headings — thematic
 * breaks, bold lead-in paragraphs, etc.
 *
 * @param opts - Configuration for the split strategy.
 * @param opts.startsAt - Predicate that returns `true` for the boundary node
 *   that opens a new group.
 * @param opts.headingFrom - Optional function that derives the group heading
 *   string from the boundary node. Defaults to `toString(node).trim()`.
 * @param opts.shape - Map of output key → extractor applied to each group's body.
 * @param opts.includeBoundary - When `true`, the boundary node is included in
 *   the group's body nodes. Default `false`.
 * @returns An extractor that yields an array of {@link GroupResult} objects.
 */
export function repeatedWhere<S extends GroupShape>(opts: {
  startsAt: (node: RootContent) => boolean;
  headingFrom?: (node: RootContent) => string;
  shape: S;
  includeBoundary?: boolean;
}): Extractor<GroupResult<S>[]> {
  return (nodes, ctx) => {
    const groups: { heading: string; nodes: RootContent[] }[] = [];
    let current: { heading: string; nodes: RootContent[] } | null = null;

    for (const node of nodes) {
      if (opts.startsAt(node)) {
        if (current) groups.push(current);
        current = {
          heading: opts.headingFrom?.(node) ?? toString(node).trim(),
          nodes: opts.includeBoundary ? [node] : [],
        };
      } else if (current) {
        current.nodes.push(node);
      }
    }
    if (current) groups.push(current);

    return groups.map((g) => {
      const out: Record<string, unknown> = { heading: g.heading };
      for (const [key, ex] of Object.entries(opts.shape)) {
        out[key] = ex(g.nodes, { section: `${ctx.section} > ${g.heading}` });
      }
      return out as GroupResult<S>;
    });
  };
}
