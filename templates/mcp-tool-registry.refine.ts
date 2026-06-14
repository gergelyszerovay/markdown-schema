import type { z } from "zod";

/**
 * Cross-section invariants for `mcp-tool-registry.template.md` (root tier).
 *
 * Within-doc rules (cross-directory checks — every `5.*.mcp-tool.md` appears as
 * a row, and vice versa — live in the tree linter, not here):
 *
 * 1. **Tool id uniqueness** — no two Registry rows share a `tool`.
 * 2. **Spec file uniqueness** — no two Registry rows share a `spec`.
 * 3. **Registry ⊆ Contents** — every Registry row's `spec` appears as a
 *    Contents row's `File`.
 * 4. **Spec file name matches tool** — a Registry row's `spec`
 *    `5.<slug>.mcp-tool.md` MUST have `<slug>` equal to the `tool` with
 *    underscores replaced by hyphens.
 */

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;

  const contents = (d["contents"] ?? []) as Array<Record<string, string>>;
  const registry = (d["registry"] ?? []) as Array<Record<string, string>>;

  const contentsFiles = new Set(
    contents.map((r) => r["File"] ?? "").filter(Boolean),
  );

  const seenTool = new Map<string, number>();
  const seenSpec = new Map<string, number>();

  registry.forEach((row, i) => {
    const tool = row["tool"] ?? "";
    const spec = row["spec"] ?? "";

    if (tool) {
      if (seenTool.has(tool)) {
        ctx.addIssue({
          code: "custom",
          path: ["registry", i, "tool"],
          message: `Duplicate tool "${tool}" (also at row ${seenTool.get(tool)! + 1}).`,
        });
      } else {
        seenTool.set(tool, i);
      }
    }

    if (spec) {
      if (seenSpec.has(spec)) {
        ctx.addIssue({
          code: "custom",
          path: ["registry", i, "spec"],
          message: `Duplicate spec file "${spec}" (also at row ${seenSpec.get(spec)! + 1}).`,
        });
      } else {
        seenSpec.set(spec, i);
      }

      if (!contentsFiles.has(spec)) {
        ctx.addIssue({
          code: "custom",
          path: ["registry", i, "spec"],
          message: `Registry spec "${spec}" has no matching row in §Contents.`,
        });
      }
    }

    // spec "5.<slug>.mcp-tool.md" slug must equal tool with _ -> -.
    if (tool && spec) {
      const m = /^[0-9]+\.(.+)\.mcp-tool\.md$/.exec(spec);
      const slug = m ? m[1] : "";
      const expected = tool.replace(/_/g, "-");
      if (slug && slug !== expected) {
        ctx.addIssue({
          code: "custom",
          path: ["registry", i, "spec"],
          message: `Spec file "${spec}" should be named for tool "${tool}" (expected slug "${expected}").`,
        });
      }
    }
  });
};
