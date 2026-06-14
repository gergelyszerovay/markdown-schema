import type { z } from "zod";

/**
 * Cross-section invariants for `cr.template.md`.
 *
 * Rules enforced here:
 *
 * 1. **CR id matches filename** — the title's numeric ID (between `CR-` and
 *    the em-dash) must equal the filename's `<NN>` prefix. Currently the
 *    refine cannot read its own filename via the parser, so this rule is
 *    documented but enforced by the docs linter (L8 / L9).
 * 2. **Status === shipped requires links** — if Status is `shipped`, the
 *    Links section MUST have at least one row of Kind `pr`.
 * 3. **Context references with kind=symbol** must be canonical citations.
 */

const SYMBOL_RE = /^@[a-z0-9_-]+\/[a-z0-9_.-]+#[A-Za-z_][A-Za-z0-9_.]*$/;

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;

  // Rule 2: shipped → at least one pr link.
  const status = (d["status"] ?? []) as Array<string>;
  // "status" is a labeled bullet list per the template ("- State: shipped")
  // → parsed as a record. Adjust if parser shape differs.
  const stateValue = Array.isArray(status)
    ? (status[0] ?? "").toString()
    : ((status as Record<string, string>)["State"] ?? "");
  const cleanState = stateValue.replace(/^State:\s*/, "").trim();
  if (cleanState === "shipped") {
    const links = (d["links"] ?? []) as Array<Record<string, string>>;
    const hasPr = links.some((r) => r["Kind"] === "pr");
    if (!hasPr) {
      ctx.addIssue({
        code: "custom",
        path: ["links"],
        message: "Status is `shipped` but no Links row with Kind=pr exists.",
      });
    }
  }

  // Rule 3: Context kind=symbol → canonical citation.
  const context = (d["context"] ?? []) as Array<Record<string, string>>;
  context.forEach((row, i) => {
    if (row["Kind"] === "symbol" && !SYMBOL_RE.test(row["Reference"] ?? "")) {
      ctx.addIssue({
        code: "custom",
        path: ["context", i, "Reference"],
        message: `Reference "${row["Reference"]}" with Kind=symbol must match \`@<group>/<pkg>#<Symbol>\`.`,
      });
    }
  });
};
