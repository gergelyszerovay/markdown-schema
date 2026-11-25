/**
 * Runs the programmatic-mode schema against the sibling `release.md` and prints
 * the typed, validated document as JSON.
 *
 * The `validate-md` CLI is template-mode only, so programmatic schemas are run
 * in code like this — call `.parse(raw)` directly.
 *
 * `release-schema.ts` imports the package's built entry point, so run
 * `pnpm build` first (otherwise the import fails with ERR_MODULE_NOT_FOUND).
 *
 * ```bash
 * pnpm build   # required first — the example imports dist/index.mjs
 * # Node 24 strips the TypeScript types automatically.
 * node examples/programmatic/run.ts
 * ```
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ReleaseDoc } from './release-schema.ts';

const here = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(here, 'release.md'), 'utf-8');

const doc: unknown = ReleaseDoc.parse(raw);
process.stdout.write(JSON.stringify(doc, null, 2) + '\n');
