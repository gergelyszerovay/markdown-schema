import type { z } from "zod";

/**
 * Cross-section invariants for `supabase-rpc.template.md`.
 *
 * Rules enforced here:
 *
 * 1. **Title matches schema.function** — `<schema>.<function>` exact.
 * 2. **Definer requires §5** — when Security=definer, the optional
 *    `RLS interaction` section MUST be present and non-empty.
 * 3. **Caller symbols, when given as @-prefixed, are canonical**.
 * 4. **Parameter names unique** — no duplicates in §2.
 */

const SYMBOL_RE = /^@[a-z0-9_-]+\/[a-z0-9_.-]+#[A-Za-z_][A-Za-z0-9_.]*$/;

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;

  const title = (d["title"] ?? "") as string;
  const identity = (d["identity"] ?? {}) as Record<string, string>;
  const schema = identity["Schema"] ?? "";
  const fn = identity["Function"] ?? "";
  const security = identity["Security"] ?? "";

  // Rule 1: title format.
  if (schema && fn) {
    const expected = `${schema}.${fn}`;
    if (title !== expected) {
      ctx.addIssue({
        code: "custom",
        path: ["title"],
        message: `Title "${title}" must equal "${expected}".`,
      });
    }
  }

  // Rule 2: definer requires §5 with non-empty content.
  if (security === "definer") {
    const rls = d["rlsInteraction"];
    if (rls === undefined || rls === null) {
      ctx.addIssue({
        code: "custom",
        path: ["rlsInteraction"],
        message:
          "Security=definer requires the optional `## 5. RLS interaction` section to be present and non-empty.",
      });
    } else if (typeof rls === "string" && rls.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["rlsInteraction"],
        message:
          "RLS interaction section must explain why definer is correct.",
      });
    }
  }

  // Rule 3: caller @-prefixed symbols canonical.
  const callers = (d["callers"] ?? []) as Array<Record<string, string>>;
  callers.forEach((row, i) => {
    const caller = row["Caller"] ?? "";
    // Only check rows that look like a symbol citation.
    if (caller.startsWith("@") && !SYMBOL_RE.test(caller)) {
      ctx.addIssue({
        code: "custom",
        path: ["callers", i, "Caller"],
        message: `Caller "${caller}" looks like a symbol citation but does not match \`@<group>/<pkg>#<SymbolName>\`.`,
      });
    }
  });

  // Rule 4: parameter names unique.
  const params = (d["parameters"] ?? []) as Array<Record<string, string>>;
  const seen = new Map<string, number>();
  params.forEach((row, i) => {
    const name = row["Name"];
    if (name && seen.has(name)) {
      ctx.addIssue({
        code: "custom",
        path: ["parameters", i, "Name"],
        message: `Duplicate parameter "${name}" (also at row ${seen.get(name)! + 1}).`,
      });
    }
    if (name) seen.set(name, i);
  });
};
