/**
 * Runs the programmatic-mode schema against the sibling `release.md` and prints
 * the typed, validated document as JSON.
 *
 * The `validate-md` CLI is template-mode only, so programmatic schemas are run
 * in code like this — call `.parse(raw)` directly.
 *
 * ```bash
 * # Node >= 22.18 strips the TypeScript types automatically.
 * node --experimental-strip-types examples/programmatic/run.ts
 * ```
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ReleaseDoc } from "./release-schema.ts";

const here = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(here, "release.md"), "utf-8");

const doc: unknown = ReleaseDoc.parse(raw);
process.stdout.write(JSON.stringify(doc, null, 2) + "\n");
