import type { DocumentOutcome } from '../document-outcome.model.ts';

/** Result of the validate-documents use case. */
export type ValidateDocumentsResult =
  | { kind: 'template-unreadable'; message: string }
  | { kind: 'template-invalid'; templatePath: string; message: string }
  | { kind: 'validated'; documents: DocumentOutcome[] };
