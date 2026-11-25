/**
 * Gets the template name a Markdown file's name asks for: the last segment of the name, after
 * dropping a leading `<n>.` level number. `2.billing.constitution.md` names `constitution`,
 * `plan.md` names `plan` and `README.md` names `README`.
 * @param fileName - The file's base name, such as `1.index.md`.
 * @returns The template name, or `null` when the file is not a Markdown file or has no name.
 */
export function templateNameOf(fileName: string): string | null {
  if (!/\.md$/i.test(fileName)) return null;
  const segments = fileName.slice(0, -'.md'.length).split('.');
  if (segments.length > 1 && /^\d+$/.test(segments[0] ?? '')) segments.shift();
  const name = segments.at(-1) ?? '';
  return name.length === 0 ? null : name;
}

/**
 * Gets the template names a Markdown file may bind to, in the order they are tried: the name
 * {@link templateNameOf} reads, then, when that name is all upper case (`CHANGELOG`, `README`,
 * `SKILL`), its lower-case form, since a template's folder name is lower case. `CHANGELOG.md`
 * binds to the template `changelog` when no template is named `CHANGELOG`; `Plan.md` and `plan.md`
 * are not mixed up, because only an all-upper-case name falls back.
 * @param fileName - The file's base name, such as `CHANGELOG.md`.
 * @returns The template names to try, empty when the file is not a Markdown file or has no name.
 */
export function templateNamesOf(fileName: string): string[] {
  const name = templateNameOf(fileName);
  if (name === null) return [];
  return /^[A-Z][A-Z0-9_-]*$/.test(name) ? [name, name.toLowerCase()] : [name];
}
