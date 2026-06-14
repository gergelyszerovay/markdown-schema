import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { z } from "zod";

/**
 * Cross-section invariants for `ts-type.template.md`.
 *
 * Per-file rules. Tree-wide checks live in the docs linter.
 *
 * Rules enforced here:
 *
 * 1. **Package exists** — Source.Package MUST appear in `pnpm-workspace.yaml`.
 * 2. **Symbol citations are canonical** — every `Related symbols.Symbol` and
 *    `Consumers.Symbol` MUST match `@<group>/<pkg>#<SymbolName>` per
 *    symbol-references.spec.
 * 3. **Title matches Export** — the document Title must equal Source.Export.
 *
 * Not enforced here (deferred to docs linter):
 *
 * - Whether the cited symbol is actually exported from the cited package
 *   (requires reading the package's entry points; cheap grep, but tree-wide
 *   concern).
 * - Whether the consumers in §3 actually import this symbol (AST scan).
 */

const SYMBOL_RE = /^@[a-z0-9_-]+\/[a-z0-9_.-]+#[A-Za-z_][A-Za-z0-9_.]*$/;
const PACKAGE_RE = /^@[a-z0-9_-]+\/[a-z0-9_.-]+$/;

function loadWorkspacePackages(): Set<string> | null {
  // Walk up from cwd to find pnpm-workspace.yaml. Cheap, no yaml dep —
  // pnpm-workspace files are simple enough to grep.
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, "pnpm-workspace.yaml");
    if (existsSync(candidate)) {
      const txt = readFileSync(candidate, "utf8");
      const globs = txt
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith("- "))
        .map((l) => l.replace(/^-\s*"?([^"]+)"?$/, "$1").trim())
        .filter((g) => !g.startsWith("!"));
      // Read each glob's package.json#name. We don't expand globs here —
      // just collect each literal directory and read its package.json.
      const names = new Set<string>();
      for (const g of globs) {
        // Strip trailing wildcards
        const literalDir = g.replace(/\/\*+.*$/, "");
        const pkgJson = join(dir, literalDir, "package.json");
        if (existsSync(pkgJson)) {
          try {
            const pkg = JSON.parse(readFileSync(pkgJson, "utf8")) as {
              name?: string;
            };
            if (pkg.name) names.add(pkg.name);
          } catch {
            // skip malformed package.json
          }
        }
      }
      return names;
    }
    const parent = join(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const workspacePackages = loadWorkspacePackages();

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;

  // Rule 1: Source.Package exists in pnpm-workspace.yaml.
  const source = (d["source"] ?? {}) as Record<string, string>;
  const pkg = source["Package"] ?? "";
  if (pkg && !PACKAGE_RE.test(pkg)) {
    ctx.addIssue({
      code: "custom",
      path: ["source", "Package"],
      message: `Package "${pkg}" must match \`@<group>/<pkg>\` shape.`,
    });
  }
  if (workspacePackages && pkg && !workspacePackages.has(pkg)) {
    ctx.addIssue({
      code: "custom",
      path: ["source", "Package"],
      message: `Package "${pkg}" is not declared in pnpm-workspace.yaml.`,
    });
  }

  // Rule 2: Symbol citations follow @<group>/<pkg>#<Symbol>.
  const related = (d["relatedSymbols"] ?? []) as Array<Record<string, string>>;
  related.forEach((row, i) => {
    const sym = row["Symbol"] ?? "";
    if (!SYMBOL_RE.test(sym)) {
      ctx.addIssue({
        code: "custom",
        path: ["related-symbols", i, "Symbol"],
        message: `Symbol "${sym}" must match \`@<group>/<pkg>#<SymbolName>\`.`,
      });
    }
  });

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

  // Rule 3: Title equals Source.Export.
  const title = (d["title"] ?? "") as string;
  const exportName = source["Export"] ?? "";
  if (title && exportName && title !== exportName) {
    ctx.addIssue({
      code: "custom",
      path: ["title"],
      message: `Title "${title}" must equal Source.Export "${exportName}".`,
    });
  }
};
