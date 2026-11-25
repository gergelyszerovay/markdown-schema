import type { DocumentBinding } from './document-binding.model.ts';

/** The bindings of a file list's Markdown files. */
export type BindDocumentsResult = {
  /** Every Markdown file in scope, ordered by path. */
  documents: DocumentBinding[];
};
