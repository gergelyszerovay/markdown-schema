import type { UnreadTemplateLink } from '../binding/unread-template-link.model.ts';
import type { DocumentOutcome } from '../document-outcome.model.ts';

/** What became of a bound document: its validation outcome, or why it was not validated. */
export type TreeOutcome =
  DocumentOutcome | { kind: 'not-validated'; path: string; message: string };

/** A document validated against the template it is bound to. */
export type TreeDocument = {
  /** Root-relative path of the document. */
  path: string;
  /** Root-relative path of the template it is bound to. */
  templatePath: string;
  outcome: TreeOutcome;
};

/** A document whose closest level holds different templates of its name. */
export type AmbiguousDocument = {
  path: string;
  /** Root-relative paths of the templates that clash, in order. */
  candidates: string[];
};

/** A template that does not compile, reported once however many documents are bound to it. */
export type TemplateFailure = {
  templatePath: string;
  message: string;
};

/** How many documents ended each way. */
export type TreeSummary = {
  /** Bound documents, validated or not. */
  documents: number;
  ok: number;
  /** Documents that failed, did not satisfy the schema or were not validated. */
  failed: number;
  ambiguous: number;
  unbound: number;
  templateErrors: number;
};

/** Result of the validate-tree use case. */
export type ValidateTreeResult =
  | { kind: 'refused'; message: string }
  | { kind: 'unreadable'; message: string }
  | {
      kind: 'validated';
      /** The root the templates were collected under. */
      root: string;
      documents: TreeDocument[];
      ambiguous: AmbiguousDocument[];
      /** Markdown files in scope that no template claims. */
      unbound: string[];
      templateErrors: TemplateFailure[];
      /**
       * Template links that stand for no template (the target lacks it, or the way there
       * crosses a symbolic link or a skipped folder): a warning, not a failure.
       */
      unreadTemplateLinks: UnreadTemplateLink[];
      summary: TreeSummary;
    };
