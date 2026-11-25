/** Regex that matches TEMPLATE-ONLY HTML comment blocks. */
const TEMPLATE_ONLY_RE = /<!--\s*TEMPLATE-ONLY:\s*([\s\S]*?)\s*-->/;

/**
 * Extracts the body from an HTML comment string of the form
 * `<!-- TEMPLATE-ONLY: ... -->`, or returns `null` if the string is not a
 * recognised template directive.
 * @param html - Raw HTML comment string.
 * @returns The directive body, or `null` if not a TEMPLATE-ONLY comment.
 */
export function extractDirectiveBody(html: string): string | null {
  const m = TEMPLATE_ONLY_RE.exec(html);
  const body = m?.[1];
  return body === undefined ? null : body.trim();
}
