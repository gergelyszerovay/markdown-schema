import type { TemplatePackage } from './template-package.model.ts';

/** What {@link listTemplates} needs: a file list, and the template folders of the listed packages. */
export type ListTemplatesInput = {
  /** Root-relative POSIX file paths. */
  paths: readonly string[];
  /** Directory names to skip. */
  ignoredDirNames?: readonly string[];
  /**
   * The template folders of the packages the root lists, in the order listed; their templates
   * form a catalog above the root. None when absent.
   */
  packages?: readonly TemplatePackage[];
};
