import type { TemplatePackage } from './binding/template-package.model.ts';

/**
 * What `TemplatePackagesPort.open` made of one key: the package's template folders and the
 * directory they are read from, or why the key is unusable.
 */
export type OpenedTemplatePackage =
  | {
      kind: 'opened';
      /** The key and the package-relative files of its template folders. */
      templatePackage: TemplatePackage;
      /** The directory the package's files are read from (the real path, for the node gateway). */
      directory: string;
    }
  | { kind: 'refused'; message: string };
