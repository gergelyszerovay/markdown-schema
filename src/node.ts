// Node-only entry point.
//
// `loadRefine` reads the filesystem and dynamically imports a sibling
// `*.refine.ts`, so it depends on `node:fs` / `node:path` / `node:url`. Keeping
// it out of the main `.` entry lets the core API (`parseTemplate`,
// `defineDocSchema`, extractors) bundle for the browser without node polyfills.
export {
  loadRefine,
  type RefineFunction,
} from "./index/parse-template/load-refine";
