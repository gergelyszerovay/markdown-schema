/**
 * Formats the usage lines of `validate-md`.
 * @returns The usage line of each mode, one per line.
 */
export function formatUsage(): string {
  return [
    'Usage: validate-md --template <file.template.md> [--emit-json <path>] [--no-refine] <md-file> [<md-file>...]',
    '       validate-md --template <file.template.md> --emit-schema',
    '       validate-md [<path>...] [--root <dir>] [--ignore <dir-or-path>]... [--no-refine] [--json] [--verbose]',
  ].join('\n');
}
