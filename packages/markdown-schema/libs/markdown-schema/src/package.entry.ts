// The package's `.` entry (`exports["."]`): the browser-safe engine API, as markdown-schema
// 0.3.0 exports it plus the row-key listing of 0.4.0, the binding conventions of 0.5.0
// (pure rules over a path list; the engine never uses them) and the template shape,
// document data model and JSON Schema walker of 0.8.0, and the document generator and skeleton of 0.9.0. Nothing here reaches `node:fs`, `node:path` or
// `node:url`; the node-only `loadRefine` is on the `./node` entry (`package-node.entry.ts`).
// This file is an `.entry.ts` block (a tsdown entry), not the library's public entry (`index.ts`).
export type { Extractor } from './lib/core/extractors/extractor.model.ts';
export type { ExtractCtx } from './lib/core/extractors/extract-ctx.model.ts';
export type { GroupShape } from './lib/core/extractors/group-shape.model.ts';
export type { GroupResult } from './lib/core/extractors/group-result.model.ts';
export { freetext } from './lib/core/extractors/freetext.rules.ts';
export { table } from './lib/core/extractors/table.rules.ts';
export { bulletList } from './lib/core/extractors/bullet-list.rules.ts';
export { taskList } from './lib/core/extractors/task-list.rules.ts';
export { codeBlocks } from './lib/core/extractors/code-blocks.rules.ts';
export { rawNodes } from './lib/core/extractors/raw-nodes.rules.ts';
export { optional } from './lib/core/extractors/optional.rules.ts';
export { fencedCodeWithMarker } from './lib/core/extractors/fenced-code-with-marker.rules.ts';
export { cellText } from './lib/core/extractors/cell-text.rules.ts';
export { repeatedWhere } from './lib/core/extractors/repeated-where.rules.ts';
export { repeated } from './lib/core/extractors/repeated.rules.ts';
export { defineDocSchema } from './lib/core/doc-schema/define-doc-schema.rules.ts';
export type { SectionSpec, DocOf } from './lib/core/doc-schema/define-doc-schema.rules.ts';
export type { AdditionalSection, DocumentData } from './lib/core/doc-schema/document-data.model.ts';
export type { SectionValue } from './lib/core/doc-schema/section-value.model.ts';
export type {
  ColumnShape,
  FieldShape,
  GroupHeadingShape,
  SectionBodyShape,
  SectionShape,
  SummaryShape,
  TemplateShape,
  TitleShape,
} from './lib/core/template/template-shape.model.ts';
export { generateDocument } from './lib/core/generate/generate-document.rules.ts';
export { generateSkeleton } from './lib/core/generate/generate-skeleton.rules.ts';
export { templateJsonSchema } from './lib/core/json-schema/template-json-schema.rules.ts';
export type { TemplateJsonSchema } from './lib/core/json-schema/template-json-schema.rules.ts';
export { parseTemplate, parseTemplateAsync } from './lib/core/template/parse-template.rules.ts';
export type { ParsedTemplate } from './lib/core/template/parse-template.rules.ts';
export { headingToKey } from './lib/core/template/heading-to-key.rules.ts';
export { listRowKeys } from './lib/core/template/list-row-keys.rules.ts';
export type { KeyColumn } from './lib/core/template/key-column.model.ts';
export type { RowKey } from './lib/core/template/row-key.model.ts';
export type { RefineFunction } from './lib/core/refine-function.model.ts';
export { bindDocuments } from './lib/core/binding/bind-documents.rules.ts';
export { listFilePaths } from './lib/core/binding/list-file-paths.rules.ts';
export { listTemplates } from './lib/core/binding/list-templates.rules.ts';
export { templateNameOf } from './lib/core/binding/template-name.rules.ts';
export {
  legacyTemplateFolderName,
  templateFolderName,
  templateFolderNames,
} from './lib/core/binding/template-folder-names.model.ts';
export type { BindDocumentsInput } from './lib/core/binding/bind-documents-input.model.ts';
export type { BindDocumentsResult } from './lib/core/binding/bind-documents-result.model.ts';
export type {
  BindingDiagnostic,
  BindingDiagnosticSeverity,
} from './lib/core/binding/binding-diagnostic.model.ts';
export type { CatalogTemplate } from './lib/core/binding/catalog-template.model.ts';
export type { DirectoryEntry } from './lib/core/binding/directory-entry.model.ts';
export type { BindingStatus, DocumentBinding } from './lib/core/binding/document-binding.model.ts';
export type { ListTemplatesInput } from './lib/core/binding/list-templates-input.model.ts';
export type {
  ListTemplatesResult,
  TemplateNameClash,
} from './lib/core/binding/list-templates-result.model.ts';
