/** One schema violation found in a document: where it is, and what is wrong. */
export type ValidationIssue = {
  /** Dot-joined location of the violation in the parsed document, or `(root)`. */
  path: string;
  message: string;
};
