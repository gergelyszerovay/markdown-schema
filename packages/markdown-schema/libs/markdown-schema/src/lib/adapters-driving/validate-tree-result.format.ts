import type {
  TreeDocument,
  ValidateTreeResult,
} from '../core/validate-tree/validate-tree.result.ts';

/**
 * Formats one validated document as output lines, the way single-template mode prints it.
 * @param document - The document and what became of it.
 * @returns The lines to print for the document.
 */
const formatDocument = ({ outcome }: TreeDocument): string[] => {
  switch (outcome.kind) {
    case 'valid':
      return [`${outcome.path}: OK`];
    case 'schema-invalid':
      return [
        `${outcome.path}: schema validation failed`,
        ...outcome.issues.map((issue) => `  - ${issue.path}: ${issue.message}`),
      ];
    case 'failed':
    case 'not-validated':
      return [`${outcome.path}: ${outcome.message}`];
  }
};

/**
 * Formats the result of a directory run as the lines `validate-md` prints to stderr: a line
 * per bound document, the ambiguous files with their candidates, the templates that did not
 * compile, the template links that stand for no template (a warning), the unbound files when
 * asked, and a summary.
 * @param result - The validate-tree result.
 * @param options - `verbose` also lists the unbound files.
 * @returns One string per output line, in order.
 */
export function formatValidateTreeResult(
  result: ValidateTreeResult,
  options: { verbose: boolean },
): string[] {
  if (result.kind !== 'validated') return [result.message];
  const { summary } = result;
  const lines = [
    ...result.templateErrors.map(
      (error) => `Error: invalid template ${error.templatePath}: ${error.message}`,
    ),
    ...result.documents.flatMap(formatDocument),
    ...result.ambiguous.map(
      (document) => `${document.path}: ambiguous template: ${document.candidates.join(', ')}`,
    ),
    ...result.unreadTemplateLinks.map(
      (link) =>
        `Warning: template link ${link.path} -> ${link.target}: no ${link.name}.template.md could be read there (it is missing, or the way there crosses a symbolic link or a skipped folder such as node_modules); no document is bound to it`,
    ),
    ...(options.verbose ? result.unbound.map((path) => `${path}: unbound`) : []),
  ];
  const templateErrors =
    summary.templateErrors === 0
      ? ''
      : `; ${String(summary.templateErrors)} template ${summary.templateErrors === 1 ? 'error' : 'errors'}`;
  lines.push(
    `${String(summary.documents)} documents: ${String(summary.ok)} OK, ${String(summary.failed)} failed; ${String(summary.ambiguous)} ambiguous; ${String(summary.unbound)} unbound${templateErrors}`,
  );
  return lines;
}
