// The package's `./node` entry (`exports["./node"]`): `loadRefine` reads the file system and
// dynamically imports a sibling `*.refine.ts`, so it depends on `node:fs`, `node:path` and
// `node:url`. Keeping it off the `.` entry lets the engine bundle for the browser without
// node polyfills. This file is the package's Node `.entry.ts` block (a tsdown entry), not the
// library's public entry (`index.ts`).
export { loadRefine } from './lib/adapters-driven/node-refine-loader.gateway.ts';
export type { RefineFunction } from './lib/core/refine-function.model.ts';
