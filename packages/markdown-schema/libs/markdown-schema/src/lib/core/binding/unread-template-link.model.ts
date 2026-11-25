/**
 * A symbolic link inside a templates folder whose template could not be read: no
 * `<name>.template.md` was listed in the directory it points to.
 */
export type UnreadTemplateLink = {
  /** Root-relative path of the link (`<templates folder>/<name>`). */
  path: string;
  /** The template name the link stands for (its file name). */
  name: string;
  /** Root-relative path the link points to. */
  target: string;
};
