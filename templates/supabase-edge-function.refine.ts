import type { z } from "zod";

/**
 * Cross-section invariants for `supabase-edge-function.template.md`.
 *
 * Rules enforced here:
 *
 * 1. **Title matches Function** — title equals Identity.Function.
 * 2. **Path matches Function** — Identity.Path equals
 *    `/functions/v1/<Function>`.
 * 3. **Flow numbering contiguous from 1** — §4 Step column.
 * 4. **Body schema symbol citations canonical** — §2 Body schema cells
 *    that start with `@` match `@<group>/<pkg>#<Symbol>`.
 * 5. **`function-jwks` requires `--no-verify-jwt`** — when Auth strategy
 *    is `function-jwks`, Identity.Deploy flag MUST contain
 *    `--no-verify-jwt`.
 */

const SYMBOL_RE = /^@[a-z0-9_-]+\/[a-z0-9_.-]+#[A-Za-z_][A-Za-z0-9_.]*$/;

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;

  const title = (d["title"] ?? "") as string;
  const identity = (d["identity"] ?? {}) as Record<string, string>;
  const fn = identity["Function"] ?? "";
  const path = identity["Path"] ?? "";
  const auth = identity["Auth strategy"] ?? "";
  const deployFlag = identity["Deploy flag"] ?? "";

  // Rule 1: title equals Function.
  if (fn && title !== fn) {
    ctx.addIssue({
      code: "custom",
      path: ["title"],
      message: `Title "${title}" must equal Identity.Function "${fn}".`,
    });
  }

  // Rule 2: path matches function.
  if (fn && path && path !== `/functions/v1/${fn}`) {
    ctx.addIssue({
      code: "custom",
      path: ["identity", "Path"],
      message: `Path "${path}" must equal "/functions/v1/${fn}".`,
    });
  }

  // Rule 3: flow numbering.
  const flow = (d["flow"] ?? []) as Array<Record<string, string>>;
  flow.forEach((row, i) => {
    const expected = String(i + 1);
    const actual = (row["Step"] ?? "").trim();
    if (actual !== expected) {
      ctx.addIssue({
        code: "custom",
        path: ["flow", i, "Step"],
        message: `Step "${actual}" at position ${i + 1}; expected "${expected}" — steps MUST be numbered 1..N contiguously.`,
      });
    }
  });

  // Rule 4: body schema symbol citations.
  const request = (d["request"] ?? []) as Array<Record<string, string>>;
  request.forEach((row, i) => {
    const schema = row["Body schema"] ?? "";
    if (schema.startsWith("@") && !SYMBOL_RE.test(schema)) {
      ctx.addIssue({
        code: "custom",
        path: ["request", i, "Body schema"],
        message: `Body schema "${schema}" looks like a symbol citation but does not match \`@<group>/<pkg>#<Symbol>\`.`,
      });
    }
  });

  // Rule 5: function-jwks requires --no-verify-jwt.
  if (auth === "function-jwks" && !deployFlag.includes("--no-verify-jwt")) {
    ctx.addIssue({
      code: "custom",
      path: ["identity", "Deploy flag"],
      message:
        "Auth strategy `function-jwks` requires Deploy flag to include `--no-verify-jwt` (gateway must not double-check the JWT).",
    });
  }
};
