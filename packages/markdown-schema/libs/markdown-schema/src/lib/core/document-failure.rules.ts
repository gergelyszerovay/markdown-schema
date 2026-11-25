import { z } from 'zod';
import type { DocumentOutcome } from './document-outcome.model.ts';
import { errorMessage } from './error-message.rules.ts';

/**
 * Turns what a document threw into its outcome: a schema violation lists its issues, any
 * other error is a failed document with the error's message.
 * @param path - The document's path.
 * @param error - What was thrown while reading, parsing or writing it.
 * @returns The `schema-invalid` or `failed` outcome.
 */
export function outcomeOfError(path: string, error: unknown): DocumentOutcome {
  if (error instanceof z.ZodError) {
    return {
      kind: 'schema-invalid',
      path,
      issues: error.issues.map((issue) => ({
        path: issue.path.length > 0 ? issue.path.join('.') : '(root)',
        message: issue.message,
      })),
    };
  }
  return { kind: 'failed', path, message: errorMessage(error) };
}
