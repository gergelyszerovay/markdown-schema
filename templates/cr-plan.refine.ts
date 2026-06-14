import type { z } from "zod";

/**
 * Cross-section invariants for `cr-plan.template.md`.
 *
 * Rules enforced here:
 *
 * 1. **At least one Deliverable** — Deliverables table MUST have ≥1 row.
 *    (Schema-level via `min-rows: 1`; restated here for documentation.)
 * 2. **Deliverable numbers are 1..N contiguous** — the `#` column starts at 1
 *    and increments by 1.
 * 3. **Implementation steps numbered 1..N contiguous** — same rule for §6.
 * 4. **Reviewed=yes implies Generated-by Tool != empty** — once a human has
 *    reviewed, the source of the draft MUST be recorded.
 */

function checkContiguousNumbering(
  rows: Array<Record<string, string>>,
  ctx: z.core.$RefinementCtx,
  sectionPath: string,
): void {
  rows.forEach((row, i) => {
    const expected = String(i + 1);
    const actual = (row["#"] ?? "").trim();
    if (actual !== expected) {
      ctx.addIssue({
        code: "custom",
        path: [sectionPath, i, "#"],
        message: `Row #${i + 1} has number "${actual}"; expected "${expected}" (rows MUST be numbered 1..N contiguously).`,
      });
    }
  });
}

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;

  // Rule 2: Deliverables numbering.
  const deliverables = (d["deliverables"] ?? []) as Array<
    Record<string, string>
  >;
  checkContiguousNumbering(deliverables, ctx, "deliverables");

  // Rule 3: Implementation steps numbering.
  const steps = (d["implementationSteps"] ?? []) as Array<
    Record<string, string>
  >;
  checkContiguousNumbering(steps, ctx, "implementation-steps");

  // Rule 4: Reviewed=yes → Tool field non-empty.
  const generatedBy = (d["generatedBy"] ?? {}) as Record<string, string>;
  const reviewed = generatedBy["Reviewed by human"];
  const tool = generatedBy["Tool"];
  if (reviewed === "yes" && (!tool || tool.trim() === "")) {
    ctx.addIssue({
      code: "custom",
      path: ["generated-by", "Tool"],
      message: "Reviewed by human is `yes`; Tool field must be non-empty.",
    });
  }
};
