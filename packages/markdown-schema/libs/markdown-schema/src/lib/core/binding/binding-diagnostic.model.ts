/** How serious a binding diagnostic is; a diagnostic never withholds the result it accompanies. */
export type BindingDiagnosticSeverity = 'info' | 'warning' | 'error';

/** A note about a catalog or a binding, attached beside the result it concerns. */
export type BindingDiagnostic = {
  severity: BindingDiagnosticSeverity;
  /** A stable, machine-readable code such as `ambiguous-template`. */
  code: string;
  message: string;
  /** The root-relative path the note is about, when it has one. */
  path?: string;
};
