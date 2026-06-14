import type { z } from "zod";

/**
 * Cross-section invariants for `zustand-store.template.md`.
 *
 * Rules enforced here:
 *
 * 1. **Title matches Source.Symbol short name** — title equals the part
 *    after `#` in Source.Symbol.
 * 2. **Hook lives in same package as Source.Symbol** — Source.Hook's
 *    package prefix equals Source.Symbol's package prefix.
 * 3. **Actions.Mutates keys exist in §2** — every state key listed in
 *    an Actions row's Mutates column appears as a State.Key.
 * 4. **Action signatures end in `=> void`** — Zustand actions are sync
 *    setters; async logic belongs outside the store. Heuristic: signature
 *    string must end with `=> void`.
 */

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;

  const title = (d["title"] ?? "") as string;
  const source = (d["source"] ?? {}) as Record<string, string>;
  const sym = source["Symbol"] ?? "";
  const hook = source["Hook"] ?? "";

  // Rule 1: title equals symbol short name.
  const symParts = sym.split("#");
  if (symParts.length === 2 && title !== symParts[1]) {
    ctx.addIssue({
      code: "custom",
      path: ["title"],
      message: `Title "${title}" must equal Source.Symbol short name "${symParts[1]}".`,
    });
  }

  // Rule 2: hook in same package.
  if (sym && hook) {
    const symPkg = sym.split("#")[0];
    const hookPkg = hook.split("#")[0];
    if (symPkg !== hookPkg) {
      ctx.addIssue({
        code: "custom",
        path: ["source", "Hook"],
        message: `Hook "${hook}" must live in the same package as Source.Symbol "${sym}" (got "${hookPkg}" vs "${symPkg}").`,
      });
    }
  }

  // Rule 3: Mutates keys exist in §2.
  const state = (d["state"] ?? []) as Array<Record<string, string>>;
  const knownKeys = new Set(state.map((r) => r["Key"]).filter(Boolean));
  const actions = (d["actions"] ?? []) as Array<Record<string, string>>;
  actions.forEach((row, i) => {
    const mutates = (row["Mutates"] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    mutates.forEach((m) => {
      if (!knownKeys.has(m)) {
        ctx.addIssue({
          code: "custom",
          path: ["actions", i, "Mutates"],
          message: `Action mutates unknown state key "${m}" — not declared in §2.`,
        });
      }
    });
  });

  // Rule 4: action signatures end in `=> void`.
  actions.forEach((row, i) => {
    const sig = (row["Signature"] ?? "").trim();
    if (sig && !sig.endsWith("=> void")) {
      ctx.addIssue({
        code: "custom",
        path: ["actions", i, "Signature"],
        message: `Signature "${sig}" must end in \`=> void\` — Zustand actions are synchronous setters.`,
      });
    }
  });
};
