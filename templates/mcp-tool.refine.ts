import type { z } from "zod";

/**
 * Cross-section invariants for `mcp-tool.template.md` (root tier).
 *
 * Rules enforced here:
 *
 * 1. **Title equals Tool** — Identity.Tool matches the title verbatim.
 * 2. **Handler lives in the server package** — the `@pkg` of Identity.Handler
 *    equals Identity.Server.
 * 3. **At least one input row** — guaranteed by the template `min-rows`, but the
 *    refine also rejects a row whose `required` is `yes` while `param` is the
 *    `(none)` placeholder (a no-arg tool's single row must be `required: no`).
 */

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;

  const title = (d["title"] ?? "") as string;
  const identity = (d["identity"] ?? {}) as Record<string, string>;
  const tool = identity["Tool"] ?? "";
  const server = identity["Server"] ?? "";
  const handler = identity["Handler"] ?? "";

  if (tool && title !== tool) {
    ctx.addIssue({
      code: "custom",
      path: ["title"],
      message: `Title "${title}" must equal Identity.Tool "${tool}".`,
    });
  }

  if (server && handler && handler.split("#")[0] !== server) {
    ctx.addIssue({
      code: "custom",
      path: ["identity", "Handler"],
      message: `Handler "${handler}" must live in the server package "${server}".`,
    });
  }

  const input = (d["input"] ?? []) as Array<Record<string, string>>;
  input.forEach((row, i) => {
    const param = row["param"] ?? "";
    const required = row["required"] ?? "";
    if (param === "(none)" && required === "yes") {
      ctx.addIssue({
        code: "custom",
        path: ["input", i, "required"],
        message: `A "(none)" input placeholder must have required="no".`,
      });
    }
  });
};
