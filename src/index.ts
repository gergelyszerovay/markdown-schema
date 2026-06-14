// Types
export type { Extractor } from "./index/_shared/extractor";
export type { ExtractCtx } from "./index/_shared/extractor/extract-ctx";
export type { GroupShape } from "./index/parse-template/infer-section/_shared/group-shape";
export type { GroupResult } from "./index/parse-template/infer-section/_shared/group-result";

// Basic extractors
export { freetext } from "./index/parse-template/infer-section/freetext";
export { table } from "./index/parse-template/infer-section/table";
export { bulletList } from "./index/parse-template/infer-section/bullet-list";
export { taskList } from "./index/parse-template/infer-section/task-list";
export { codeBlocks } from "./index/code-blocks";
export { rawNodes } from "./index/raw-nodes";

// Combinators / specialized
export { optional } from "./index/parse-template/infer-section/optional";
export { fencedCodeWithMarker } from "./index/fenced-code-with-marker";

// Repeating groups
export { repeatedWhere } from "./index/parse-template/infer-section/repeated/repeated-where";
export { repeated } from "./index/parse-template/infer-section/repeated";

// Doc schema builder
export {
  defineDocSchema,
  type SectionSpec,
  type DocOf,
} from "./index/parse-template/define-doc-schema";

// Template-as-source
export { parseTemplate, headingToKey } from "./index/parse-template";
// `RefineFunction` is a type (erased at runtime, no node dependency) so it stays
// on the browser-safe `.` entry. The `loadRefine` *value* reads the filesystem
// and lives on the node-only `markdown-schema/node` entry.
export type { RefineFunction } from "./index/parse-template/load-refine";
