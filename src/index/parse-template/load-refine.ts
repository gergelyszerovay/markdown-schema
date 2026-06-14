import { existsSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { pathToFileURL } from "node:url";
import type { z } from "zod";

/** Signature of the `refine` export in a `*.refine.ts` companion file. */
export type RefineFunction = (doc: unknown, ctx: z.core.$RefinementCtx) => void;

/**
 * Looks for a `<stem>.refine.ts` file next to the template and, if found,
 * dynamically imports its `refine` named export.
 *
 * The file is loaded with a plain `import()` call — Node ≥ 22.18 strips
 * TypeScript types natively, so no `tsx` wrapper is needed at runtime.
 *
 * @param templatePath - Absolute path to the `*.template.md` file.
 * @returns The `refine` function, or `undefined` if no companion file exists.
 */
export async function loadRefine(
  templatePath: string,
): Promise<RefineFunction | undefined> {
  const dir = dirname(templatePath);
  const stemBase = basename(templatePath).replace(/\.template\.md$/, "");
  const fullPath = resolve(dir, `${stemBase}.refine.ts`);

  if (!existsSync(fullPath)) return undefined;

  const mod = (await import(pathToFileURL(fullPath).href)) as Record<
    string,
    unknown
  >;
  const fn = mod["refine"];
  if (typeof fn !== "function") return undefined;
  return fn as RefineFunction;
}
