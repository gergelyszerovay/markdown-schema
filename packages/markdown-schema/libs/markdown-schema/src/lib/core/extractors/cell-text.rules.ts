import type { Nodes } from 'mdast';

/**
 * Stringifies an mdast node (or list of nodes) to plain text for fill-value
 * extraction, mirroring `mdast-util-to-string` with one deliberate deviation:
 * a `link` node is stringified to its **url**, not its label/children.
 *
 * Why: doc-path citations in template cells are written as Markdown links
 * `[label](path)`. `mdast-util-to-string` flattens `[label](url)` to `label`,
 * so refines would never see the URL. Yielding `node.url` lets refines validate
 * the target while GitHub and spec-viz render a native link. Autolinks are
 * unaffected (their url equals their label). The legacy backtick form still
 * works: `inlineCode`/`text`/`html` keep yielding their `value`.
 *
 * Node handling (everything except `link` matches stock behaviour):
 * - `link` → `node.url` (label/children ignored)
 * - `inlineCode` / `text` / `html` (any node with `value`) → `value`
 * - `image` / `imageReference` → `alt`
 * - `linkReference` → **throws**. The reference points at a definition node
 *   elsewhere in the tree, unreachable from here, so its URL cannot be
 *   recovered. Flattening to the label would let a citation regex validate the
 *   label while the real target is never checked, so link references are
 *   rejected rather than silently accepted; use inline links `[label](path)`.
 * @param value - An mdast node or array of nodes.
 * @returns The serialized text.
 */
export function cellText(value: unknown): string {
  // Serialize one node (or a bare array of nodes). Mutually recursive with
  // `all`; both are nested so this module keeps a single top-level export.
  const one = (v: unknown): string => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const n = v as Partial<Nodes> & {
        value?: string;
        url?: string;
        alt?: string;
        children?: unknown[];
      };

      // Deliberate deviation from mdast-util-to-string: a link stringifies to
      // its URL so refines can validate the citation target.
      if (n.type === 'link' && typeof n.url === 'string') {
        return n.url;
      }

      // A reference-style link `[label][ref]` points at a definition elsewhere
      // in the tree that is unreachable from here, so its target cannot be
      // recovered. Flattening to the label would let a citation regex validate
      // the label while the real target is never checked — a fail-open hole.
      // Reject it and direct the author to an inline link.
      if (n.type === 'linkReference') {
        throw new Error(
          `reference-style link (\`[label][ref]\`) is not supported in a value cell; use an inline link \`[label](path)\` so the citation target can be validated`,
        );
      }

      if (typeof n.value === 'string') {
        return n.value;
      }

      if (typeof n.alt === 'string' && n.alt) {
        return n.alt;
      }

      if (Array.isArray(n.children)) {
        return all(n.children);
      }
    }

    if (Array.isArray(v)) {
      return all(v);
    }

    return '';
  };

  // Concatenate the serialization of every node in a list.
  const all = (values: unknown[]): string => {
    let result = '';
    for (const v of values) result += one(v);
    return result;
  };

  return one(value);
}
