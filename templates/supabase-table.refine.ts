import type { z } from "zod";

/**
 * Cross-section invariants for `supabase-table.template.md`.
 *
 * Rules enforced here:
 *
 * 1. **Title matches schema.table** — title must equal `<schema>.<table>`
 *    (e.g. `public.user_favorites`) or just `<table>` when schema is
 *    `public`.
 * 2. **Column names unique** — no two rows in §2 share a Name.
 * 3. **Index column references** — every Index.Columns string must
 *    reference at least one declared column.
 * 4. **Consumer canonical citations** — every Consumers.Symbol matches
 *    `@<group>/<pkg>#<SymbolName>`.
 */

const SYMBOL_RE = /^@[a-z0-9_-]+\/[a-z0-9_.-]+#[A-Za-z_][A-Za-z0-9_.]*$/;

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;

  const title = (d["title"] ?? "") as string;
  const identity = (d["identity"] ?? {}) as Record<string, string>;
  const schema = identity["Schema"] ?? "";
  const table = identity["Table"] ?? "";

  // Rule 1: title matches schema.table (or just table when schema=public).
  if (schema && table) {
    const fullName = schema === "public" ? table : `${schema}.${table}`;
    if (title !== fullName && title !== `${schema}.${table}`) {
      ctx.addIssue({
        code: "custom",
        path: ["title"],
        message: `Title "${title}" must equal "${fullName}" (or "${schema}.${table}").`,
      });
    }
  }

  // Rule 2: column names unique.
  const columns = (d["columns"] ?? []) as Array<Record<string, string>>;
  const colNames = new Map<string, number>();
  columns.forEach((row, i) => {
    const name = row["Name"];
    if (name && colNames.has(name)) {
      ctx.addIssue({
        code: "custom",
        path: ["columns", i, "Name"],
        message: `Duplicate column "${name}" (also at row ${colNames.get(name)! + 1}).`,
      });
    }
    if (name) colNames.set(name, i);
  });

  // Rule 3: index columns reference declared columns.
  const indexes = (d["indexes"] ?? []) as Array<Record<string, string>>;
  indexes.forEach((row, i) => {
    const cols = row["Columns"] ?? "";
    const referenced = [...cols.matchAll(/\b([a-z][a-z0-9_]*)\b/g)].map(
      (m) => m[1],
    );
    const knownCols = new Set(colNames.keys());
    const unknown = referenced.filter(
      (c) =>
        !knownCols.has(c) &&
        // Skip Postgres keywords commonly seen in index expressions.
        !["desc", "asc", "nulls", "first", "last", "where"].includes(c),
    );
    if (unknown.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["indexes", i, "Columns"],
        message: `Index references unknown column(s): ${unknown.join(", ")}.`,
      });
    }
  });

  // Rule 4: consumer symbol citations canonical.
  const consumers = (d["consumers"] ?? []) as Array<Record<string, string>>;
  consumers.forEach((row, i) => {
    const sym = row["Symbol"] ?? "";
    if (!SYMBOL_RE.test(sym)) {
      ctx.addIssue({
        code: "custom",
        path: ["consumers", i, "Symbol"],
        message: `Symbol "${sym}" must match \`@<group>/<pkg>#<SymbolName>\`.`,
      });
    }
  });
};
