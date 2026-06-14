import type { z } from "zod";

/**
 * Cross-section invariants for `design.template.md` (the DESIGN.md format).
 *
 * The DESIGN.md tokens live in the YAML frontmatter; the markdown body holds
 * prose rationale. `validate-md` exposes the parsed frontmatter on
 * `doc.frontmatter` (the template grammar does not describe frontmatter
 * keys), so all token-level rules are enforced here.
 *
 * Rules enforced:
 *
 * 1. **name required** — `frontmatter.name` is a non-empty string.
 * 2. **primary color required** — `frontmatter.colors` exists and includes a
 *    non-empty `primary` entry.
 * 3. **colors are valid CSS colors** — every `colors.*` value parses as a CSS
 *    color (hex / rgb(a) / hsl(a) / hwb / oklch / oklab / lch / lab /
 *    color-mix / named / transparent).
 * 4. **token references resolve** — every `{group.token}` reference anywhere
 *    in the frontmatter points at a token defined in that group.
 *
 * NOTE: component state coverage (e.g. requiring a `-hover` variant for every
 * interactive component) is intentionally NOT enforced here.
 *
 * NOTE: section ORDER is not enforced here. `validate-md` re-keys sections by
 * template order, so the parsed `doc` no longer carries the document's heading
 * sequence — a refine rule cannot observe out-of-order sections. The canonical
 * order is documented in design.template.md and read by humans top-to-bottom.
 */

// CSS named colors are a large set; accept the common ones plus the universal
// keywords. Unknown bare words are rejected so typos surface.
const NAMED_COLORS = new Set([
  "transparent",
  "currentcolor",
  "inherit",
  "initial",
  "unset",
  "black",
  "white",
  "red",
  "green",
  "blue",
  "yellow",
  "orange",
  "purple",
  "gray",
  "grey",
  "silver",
  "maroon",
  "olive",
  "lime",
  "aqua",
  "teal",
  "navy",
  "fuchsia",
  "cornflowerblue",
]);

const HEX_RE = /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const FUNC_RE =
  /^(rgb|rgba|hsl|hsla|hwb|oklch|oklab|lch|lab|color|color-mix)\(.+\)$/i;

const isCssColor = (value: string): boolean => {
  const v = value.trim();
  if (v === "") return false;
  if (HEX_RE.test(v)) return true;
  if (FUNC_RE.test(v)) return true;
  if (NAMED_COLORS.has(v.toLowerCase())) return true;
  return false;
};

const REF_RE = /^\{([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_.-]+)\}$/;

type Frontmatter = {
  name?: unknown;
  colors?: Record<string, unknown>;
  typography?: Record<string, unknown>;
  rounded?: Record<string, unknown>;
  spacing?: Record<string, unknown>;
  components?: Record<string, Record<string, unknown>>;
};

/** Returns the set of `group.token` paths defined in the frontmatter. */
const collectDefinedTokens = (fm: Frontmatter): Set<string> => {
  const defined = new Set<string>();
  for (const group of ["colors", "typography", "rounded", "spacing"] as const) {
    const map = fm[group];
    if (map && typeof map === "object") {
      for (const key of Object.keys(map)) defined.add(`${group}.${key}`);
    }
  }
  return defined;
};

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as { frontmatter?: Frontmatter } & Record<string, unknown>;
  const fm = d.frontmatter;

  // Rule 1: name required.
  if (!fm || typeof fm.name !== "string" || fm.name.trim() === "") {
    ctx.addIssue({
      code: "custom",
      path: ["frontmatter", "name"],
      message: "DESIGN.md frontmatter must define a non-empty `name`.",
    });
  }

  // Rule 2: primary color required.
  const colors = fm?.colors;
  if (!colors || typeof colors !== "object") {
    ctx.addIssue({
      code: "custom",
      path: ["frontmatter", "colors"],
      message: "DESIGN.md frontmatter must define a `colors` map.",
    });
  } else {
    const primary = colors["primary"];
    if (typeof primary !== "string" || primary.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["frontmatter", "colors", "primary"],
        message: "`colors` must include a non-empty `primary` entry.",
      });
    }

    // Rule 3: colors are valid CSS colors.
    for (const [name, value] of Object.entries(colors)) {
      if (typeof value !== "string" || !isCssColor(value)) {
        ctx.addIssue({
          code: "custom",
          path: ["frontmatter", "colors", name],
          message: `colors.${name} = "${String(value)}" is not a valid CSS color.`,
        });
      }
    }
  }

  // Rule 4: token references resolve.
  if (fm) {
    const defined = collectDefinedTokens(fm);
    const checkRef = (value: unknown, path: (string | number)[]): void => {
      if (typeof value !== "string") return;
      const m = REF_RE.exec(value.trim());
      if (!m) return;
      const ref = `${m[1]}.${m[2]}`;
      // component composite refs (e.g. {typography.body}) resolve against
      // the same defined-token set.
      if (!defined.has(ref)) {
        ctx.addIssue({
          code: "custom",
          path,
          message: `Reference "${value}" does not resolve to a defined token.`,
        });
      }
    };

    const components = fm.components;
    if (components && typeof components === "object") {
      for (const [compName, props] of Object.entries(components)) {
        if (props && typeof props === "object") {
          for (const [propName, value] of Object.entries(props)) {
            checkRef(value, [
              "frontmatter",
              "components",
              compName,
              propName,
            ]);
          }
        }
      }
    }
  }
};
