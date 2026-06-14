import type { z } from "zod";

/**
 * Cross-section invariants for `tanstack-query.template.md`.
 *
 * Rules enforced here:
 *
 * 1. **Title matches Source.Key catalogue short name** — title equals the
 *    part after `#` in Source.Key catalogue.
 * 2. **Query / Mutation / Prefetch hooks live in the same package as
 *    the key catalogue**.
 * 3. **Every query/mutation key referenced exists in §2** — Query.Key and
 *    Mutation.Invalidates onSettled and Prefetch keys must reference a
 *    key declared in §2 (via the catalogue prefix).
 */

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;

  const title = (d["title"] ?? "") as string;
  const source = (d["source"] ?? {}) as Record<string, string>;
  const catalogue = source["Key catalogue"] ?? "";
  const cataloguePkg = catalogue.split("#")[0];
  const catalogueShort = catalogue.split("#")[1];

  // Rule 1: title matches catalogue short name.
  if (catalogueShort && title !== catalogueShort) {
    ctx.addIssue({
      code: "custom",
      path: ["title"],
      message: `Title "${title}" must equal Source.Key catalogue short name "${catalogueShort}".`,
    });
  }

  // Rule 2: hooks live in the same package.
  const checkHookPackage = (hook: string, path: (string | number)[]): void => {
    if (!hook) return;
    const pkg = hook.split("#")[0];
    if (pkg !== cataloguePkg) {
      ctx.addIssue({
        code: "custom",
        path,
        message: `Hook "${hook}" must live in the catalogue's package "${cataloguePkg}".`,
      });
    }
  };

  const queries = (d["queries"] ?? []) as Array<Record<string, string>>;
  queries.forEach((row, i) => {
    checkHookPackage(row["Hook"] ?? "", ["queries", i, "Hook"]);
  });

  const mutations = (d["mutations"] ?? []) as Array<Record<string, string>>;
  mutations.forEach((row, i) => {
    checkHookPackage(row["Hook"] ?? "", ["mutations", i, "Hook"]);
  });

  const prefetches = (d["prefetchPoints"] ?? []) as Array<
    Record<string, string>
  >;
  prefetches.forEach((row, i) => {
    checkHookPackage(row["Symbol"] ?? "", ["prefetch-points", i, "Symbol"]);
  });

  // Rule 3: referenced keys exist in §2.
  const keys = (d["keys"] ?? []) as Array<Record<string, string>>;
  const knownKeys = new Set(keys.map((r) => r["Key"]).filter(Boolean));
  if (!catalogueShort) return;

  const checkKeyRef = (text: string, path: (string | number)[]): void => {
    // Look for `<catalogueShort>.<keyName>` references.
    const matches = [
      ...text.matchAll(
        new RegExp(`\\b${catalogueShort}\\.([a-z][a-zA-Z0-9_]*)\\b`, "g"),
      ),
    ];
    matches.forEach((m) => {
      const referenced = m[1];
      if (!knownKeys.has(referenced)) {
        ctx.addIssue({
          code: "custom",
          path,
          message: `References unknown key "${catalogueShort}.${referenced}" — not declared in §2.`,
        });
      }
    });
  };

  queries.forEach((row, i) => {
    checkKeyRef(row["Key"] ?? "", ["queries", i, "Key"]);
  });
  mutations.forEach((row, i) => {
    checkKeyRef(row["Invalidates onSettled"] ?? "", [
      "mutations",
      i,
      "Invalidates onSettled",
    ]);
  });
};
