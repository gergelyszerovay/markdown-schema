import type { Html } from 'mdast';
import type { Extractor } from './extractor.model.ts';

/**
 * Extracts a fenced code block that is immediately preceded by an HTML comment
 * matching `opts.marker`.
 * @param opts - Configuration for the marker pattern. `marker`: regular expression tested against each HTML comment node. `markerLabel`: human-readable label used in error messages.
 * @returns An extractor that yields `{ lang, value }` of the matched code block.
 */
export function fencedCodeWithMarker(opts: {
  marker: RegExp;
  markerLabel?: string;
}): Extractor<{ lang: string | null; value: string }> {
  return (nodes, { section }) => {
    const idx = nodes.findIndex((n): n is Html => n.type === 'html' && opts.marker.test(n.value));
    if (idx === -1) {
      throw new Error(
        `Section "${section}" must contain ${opts.markerLabel ?? 'a marker comment'}`,
      );
    }
    const next = nodes[idx + 1];
    if (next?.type !== 'code') {
      throw new Error(
        `Section "${section}": code block must follow ${opts.markerLabel ?? 'the marker'}`,
      );
    }
    return { lang: next.lang ?? null, value: next.value };
  };
}
