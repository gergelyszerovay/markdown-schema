import type { z } from "zod";

/**
 * Cross-section invariants for `business-flow.template.md`.
 *
 * Rules enforced here:
 *
 * 1. **Step numbering contiguous from 1** — §3 row `#` column starts at 1
 *    and increments by 1.
 * 2. **Symbol citations canonical** — every Target cell in §3 and
 *    Reference cell in §8 that starts with `@` matches
 *    `@<group>/<pkg>#<Symbol>`.
 * 3. **Cross-tier doc references absolute** — Reference cells with
 *    Kind != symbol-ish that look like a doc path MUST start with `/`
 *    (repo-root absolute) when they cross a tier boundary. Best-effort:
 *    flag any value starting with `../` as a likely cross-tier `..` chain.
 */

const SYMBOL_RE = /^@[a-z0-9_-]+\/[a-z0-9_.-]+#[A-Za-z_][A-Za-z0-9_.]*$/;

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;

  // Rule 1: step numbering.
  const steps = (d["steps"] ?? []) as Array<Record<string, string>>;
  steps.forEach((row, i) => {
    const expected = String(i + 1);
    const actual = (row["#"] ?? "").trim();
    if (actual !== expected) {
      ctx.addIssue({
        code: "custom",
        path: ["steps", i, "#"],
        message: `Step "${actual}" should be "${expected}" — steps MUST be numbered 1..N contiguously.`,
      });
    }
  });

  // Rule 2: target symbol citations.
  steps.forEach((row, i) => {
    const target = row["Target"] ?? "";
    if (target.startsWith("@") && !SYMBOL_RE.test(target)) {
      ctx.addIssue({
        code: "custom",
        path: ["steps", i, "Target"],
        message: `Target "${target}" looks like a symbol citation but does not match \`@<group>/<pkg>#<SymbolName>\`.`,
      });
    }
  });

  const refs = (d["references"] ?? []) as Array<Record<string, string>>;
  refs.forEach((row, i) => {
    const ref = row["Reference"] ?? "";
    if (ref.startsWith("@") && !SYMBOL_RE.test(ref)) {
      ctx.addIssue({
        code: "custom",
        path: ["references", i, "Reference"],
        message: `Reference "${ref}" looks like a symbol citation but does not match \`@<group>/<pkg>#<SymbolName>\`.`,
      });
    }

    // Rule 3: doc paths with `../` likely cross tiers.
    if (ref.startsWith("../")) {
      ctx.addIssue({
        code: "custom",
        path: ["references", i, "Reference"],
        message: `Reference "${ref}" uses a relative \`../\` path. Cross-tier doc references MUST be repo-root absolute (start with \`/\`).`,
      });
    }
  });
};
