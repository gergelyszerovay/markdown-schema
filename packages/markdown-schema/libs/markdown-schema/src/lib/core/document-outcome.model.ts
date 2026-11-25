import type { ValidationIssue } from './validation-issue.model.ts';

/** What happened to one document when it was validated against the template's schema. */
export type DocumentOutcome =
  | { kind: 'valid'; path: string; wrote: string | undefined }
  | { kind: 'schema-invalid'; path: string; issues: ValidationIssue[] }
  | { kind: 'failed'; path: string; message: string };
