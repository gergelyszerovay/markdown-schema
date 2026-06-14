import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { z } from "zod";

/**
 * Cross-section invariants for `feature.template.md`.
 *
 * Rules enforced here:
 *
 * 1. **Package exists** — Source.Package MUST appear in `pnpm-workspace.yaml`.
 * 2. **Feature key matches package** — Source.Feature-key MUST appear in the
 *    cited package's `package.json#fractalTs.features` map.
 * 3. **All §2 export symbols belong to the cited package** — each Symbol's
 *    package prefix MUST equal Source.Package.
 * 4. **Symbol canonicality** — every Symbol cell in §2 MUST match
 *    `@<group>/<pkg>#<SymbolName>`.
 *
 * Not enforced here (deferred to docs linter):
 *
 * - Whether each exported symbol is actually exported by the package
 *   entry points (AST or grep check).
 * - Whether the §2 exports list matches the package's
 *   `fractalTs.features[<key>]` array exactly (length + names).
 */

const SYMBOL_RE = /^@[a-z0-9_-]+\/[a-z0-9_.-]+#[A-Za-z_][A-Za-z0-9_]*$/;

function findWorkspaceRoot(): string | null {
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = join(dir, "..");
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

function loadWorkspacePackages(
  root: string,
): Map<string, { dir: string; pkg: Record<string, unknown> }> {
  const workspaceText = readFileSync(
    join(root, "pnpm-workspace.yaml"),
    "utf8",
  );
  const globs = workspaceText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.replace(/^-\s*"?([^"]+)"?$/, "$1").trim())
    .filter((g) => !g.startsWith("!"));
  const result = new Map<string, { dir: string; pkg: Record<string, unknown> }>();
  for (const g of globs) {
    const literalDir = g.replace(/\/\*+.*$/, "");
    const pkgJsonPath = join(root, literalDir, "package.json");
    if (!existsSync(pkgJsonPath)) continue;
    try {
      const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8")) as Record<
        string,
        unknown
      >;
      const name = pkg["name"];
      if (typeof name === "string") {
        result.set(name, { dir: literalDir, pkg });
      }
    } catch {
      // skip malformed
    }
  }
  return result;
}

const workspaceRoot = findWorkspaceRoot();
const workspacePackages = workspaceRoot
  ? loadWorkspacePackages(workspaceRoot)
  : new Map();

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;

  const source = (d["source"] ?? {}) as Record<string, string>;
  const pkgName = source["Package"] ?? "";
  const featureKey = source["Feature key"] ?? "";

  // Rule 1: Package exists.
  if (pkgName && !workspacePackages.has(pkgName)) {
    ctx.addIssue({
      code: "custom",
      path: ["source", "Package"],
      message: `Package "${pkgName}" is not declared in pnpm-workspace.yaml.`,
    });
  }

  // Rule 2: Feature key appears in package.json#fractalTs.features.
  if (pkgName && featureKey && workspacePackages.has(pkgName)) {
    const { pkg } = workspacePackages.get(pkgName)!;
    const fractalTs = pkg["fractalTs"] as
      | { features?: Record<string, unknown> }
      | undefined;
    const features = fractalTs?.features ?? {};
    if (!(featureKey in features)) {
      ctx.addIssue({
        code: "custom",
        path: ["source", "Feature key"],
        message: `Feature key "${featureKey}" not found in ${pkgName}'s package.json#fractalTs.features.`,
      });
    }
  }

  // Rules 3 + 4: §2 exports.
  const exportsRows = (d["exports"] ?? []) as Array<Record<string, string>>;
  exportsRows.forEach((row, i) => {
    const sym = row["Symbol"] ?? "";
    if (!SYMBOL_RE.test(sym)) {
      ctx.addIssue({
        code: "custom",
        path: ["exports", i, "Symbol"],
        message: `Symbol "${sym}" must match \`@<group>/<pkg>#<SymbolName>\`.`,
      });
      return;
    }
    if (pkgName) {
      const symPkg = sym.split("#")[0];
      if (symPkg !== pkgName) {
        ctx.addIssue({
          code: "custom",
          path: ["exports", i, "Symbol"],
          message: `Symbol "${sym}" package "${symPkg}" does not match Source.Package "${pkgName}".`,
        });
      }
    }
  });
};
