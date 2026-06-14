import type { z } from "zod";

/**
 * Cross-section invariants for `index.template.md`.
 *
 * Per-file rules. Tree-level checks (L1/L2/L3/L4/L10) live in the docs linter,
 * see apps/terv-dev/layered-docs/2.spec-system/3.linter.spec.md.
 *
 * Rules enforced here:
 *
 * 1. **Contents row uniqueness** — Topic and File columns are each unique
 *    within the table (no duplicate rows referring to the same child).
 * 2. **Cross-Domain section presence** — if a `## Cross-Domain` heading
 *    appears, the table MUST have at least one row.
 *
 * Notes on what is NOT enforced here:
 *
 * - Link absence in Key Points bullets: the parser strips inline link
 *   markup via `mdast-util-to-string` before the refine sees the bullet,
 *   so the rule cannot be detected post-parse. The docs linter walks the
 *   raw AST and enforces it.
 * - Banned topic terms: tree-wide concern with documented exception list
 *   (see scopes.spec), belongs in the docs linter (L5).
 */

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;

  // Rule 1: Contents row uniqueness on Topic and File.
  const contents = (d["contents"] ?? []) as Array<Record<string, string>>;
  const seenTopics = new Map<string, number>();
  const seenFiles = new Map<string, number>();
  contents.forEach((row, i) => {
    const topic = row["Topic"];
    const file = row["File"];
    if (topic && seenTopics.has(topic)) {
      ctx.addIssue({
        code: "custom",
        path: ["contents", i, "Topic"],
        message: `Duplicate Topic "${topic}" (also at row ${seenTopics.get(topic)! + 1}).`,
      });
    }
    if (file && seenFiles.has(file)) {
      ctx.addIssue({
        code: "custom",
        path: ["contents", i, "File"],
        message: `Duplicate File link "${file}" (also at row ${seenFiles.get(file)! + 1}).`,
      });
    }
    if (topic) seenTopics.set(topic, i);
    if (file) seenFiles.set(file, i);
  });

  // Rule 2: If Cross-Domain section is present, it must have at least one row.
  if ("crossDomain" in d) {
    const crossDomain = d["crossDomain"] as Array<unknown> | undefined;
    if (!Array.isArray(crossDomain) || crossDomain.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["crossDomain"],
        message:
          "Cross-Domain section is present but empty. Either add at least one row, or remove the section.",
      });
    }
  }
};
