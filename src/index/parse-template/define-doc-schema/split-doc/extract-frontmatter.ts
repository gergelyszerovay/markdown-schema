import { parse as parseYaml } from "yaml";
import type { Root } from "mdast";

/**
 * Reads the YAML frontmatter from a parsed mdast tree.
 *
 * Requires the `remark-frontmatter` plugin to have run during parsing so that
 * a leading `---`-fenced block is represented as a `yaml` root node. When no
 * frontmatter is present, returns `undefined`. An empty frontmatter block
 * (`---\n---`) parses to `undefined` via `yaml` and is normalized to an empty
 * object so callers can distinguish "absent" from "present but empty".
 *
 * @param tree - The parsed mdast Root node.
 * @returns The parsed frontmatter object, or `undefined` when no frontmatter
 *   block exists.
 */
export function extractFrontmatter(tree: Root): unknown {
  const node = tree.children.find((n) => n.type === "yaml");
  if (!node) return undefined;
  const raw = (node as { value: string }).value;
  const parsed = parseYaml(raw) as unknown;
  return parsed ?? {};
}
