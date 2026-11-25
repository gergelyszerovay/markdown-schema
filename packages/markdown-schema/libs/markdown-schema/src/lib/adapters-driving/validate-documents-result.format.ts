import type { DocumentOutcome } from '../core/document-outcome.model.ts';
import type { ValidateDocumentsResult } from '../core/validate-documents/validate-documents.result.ts';

/**
 * Formats one document's outcome as output lines.
 * @param outcome - The document's outcome.
 * @returns The lines to print for the document.
 */
const formatOutcome = (outcome: DocumentOutcome): string[] => {
  switch (outcome.kind) {
    case 'valid':
      return [
        outcome.wrote === undefined
          ? `${outcome.path}: OK`
          : `${outcome.path}: OK (wrote ${outcome.wrote})`,
      ];
    case 'schema-invalid':
      return [
        `${outcome.path}: schema validation failed`,
        ...outcome.issues.map((issue) => `  - ${issue.path}: ${issue.message}`),
      ];
    case 'failed':
      return [`${outcome.path}: ${outcome.message}`];
  }
};

/**
 * Formats the result of a validation run as the lines `validate-md` prints to stderr.
 * @param result - The validate-documents result.
 * @returns One string per output line, in order.
 */
export function formatValidateDocumentsResult(result: ValidateDocumentsResult): string[] {
  switch (result.kind) {
    case 'template-unreadable':
      return [`Error: cannot read template: ${result.message}`];
    case 'template-invalid':
      return [`Error: invalid template ${result.templatePath}: ${result.message}`];
    case 'validated':
      return result.documents.flatMap(formatOutcome);
  }
}
