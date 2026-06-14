import type { z } from "zod";

/**
 * Cross-section invariants for `view-component.template.md`.
 *
 * Rules enforced here:
 *
 * 1. **Title matches Source.Symbol short name** — title equals the part
 *    after `#` in Source.Symbol.
 * 2. **View kind forbids effects/non-ui-local state** — per the React
 *    view-component guideline at
 *    /root-layered-docs/1.architecture/2.react-view-component.spec.md.
 * 3. **Container kind with sibling View** — Sibling View MUST be a
 *    canonical citation OR the literal `n/a`.
 * 4. **View kind has no Sibling View** — Sibling View MUST be `n/a` for
 *    pure Views and ViewStateHooks.
 */

const SYMBOL_RE = /^@[a-z0-9_-]+\/[a-z0-9_.-]+#[A-Z][A-Za-z0-9_]*$/;

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;

  const title = (d["title"] ?? "") as string;
  const source = (d["source"] ?? {}) as Record<string, string>;
  const sym = source["Symbol"] ?? "";
  const kind = source["Kind"] ?? "";
  const siblingView = (source["Sibling View"] ?? "").trim();

  // Rule 1: title equals symbol short name.
  const symParts = sym.split("#");
  if (symParts.length === 2 && title !== symParts[1]) {
    ctx.addIssue({
      code: "custom",
      path: ["title"],
      message: `Title "${title}" must equal Source.Symbol short name "${symParts[1]}".`,
    });
  }

  // Rule 2: View kind forbids effects + non-ui-local state.
  if (kind === "View" || kind === "ViewStateHook") {
    if ("effects" in d) {
      ctx.addIssue({
        code: "custom",
        path: ["effects"],
        message: `Kind=${kind} MUST NOT declare an Effects section. Promote to a container if effects are needed.`,
      });
    }
    const stateRows = (d["state"] ?? []) as Array<Record<string, string>>;
    stateRows.forEach((row, i) => {
      if (row["Kind"] && row["Kind"] !== "ui-local") {
        ctx.addIssue({
          code: "custom",
          path: ["state", i, "Kind"],
          message: `Kind=${kind} MUST only have ui-local state, got "${row["Kind"]}". Promote to a container.`,
        });
      }
    });
  }

  // Rule 3 + 4: Sibling View constraints.
  if (kind === "Container" || kind === "Container+View") {
    if (siblingView && siblingView !== "n/a" && !SYMBOL_RE.test(siblingView)) {
      ctx.addIssue({
        code: "custom",
        path: ["source", "Sibling View"],
        message: `Sibling View "${siblingView}" must match \`@<group>/<pkg>#<SymbolName>\` or be the literal "n/a".`,
      });
    }
  } else {
    // Kind=View or ViewStateHook — Sibling View MUST be n/a.
    if (siblingView !== "n/a") {
      ctx.addIssue({
        code: "custom",
        path: ["source", "Sibling View"],
        message: `Kind=${kind} requires Sibling View = "n/a" (got "${siblingView}").`,
      });
    }
  }
};
