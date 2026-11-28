import type { ListedTemplatePackages } from './listed-template-packages.model.ts';
import type { OpenedTemplatePackage } from './opened-template-package.model.ts';

/**
 * Secondary port that reads which installed packages a root lists for their templates and lists
 * each one's template folders, so the use cases never read a manifest or a package themselves.
 * @failure Both methods refuse, rather than reject: `listed` a `package.json` that does not parse
 * or a field that is not a list of names; `open` a key the root does not declare, a package that
 * is not installed, and an installed manifest that names another package. A folder that cannot be
 * listed is left out.
 */
export type TemplatePackagesPort = {
  /**
   * Reads `markdownSchema.templatePackages` of the root's `package.json`.
   * @param root - The root `DirectoryPort.locate` returned.
   * @returns The keys in the order listed; none without the field or the manifest.
   */
  listed(root: string): Promise<ListedTemplatePackages>;
  /**
   * Opens one listed package: checks that the root declares it in `dependencies` or
   * `devDependencies` and that it is installed as that package, then lists only its template
   * folders (`markdown-schema-templates/<name>/` and
   * `skills/<skill>/markdown-schema-templates/<name>/`).
   * @param root - The root `DirectoryPort.locate` returned.
   * @param key - The dependency's key (an npm alias by its key).
   * @returns The package's template files and its directory, or why it cannot be used.
   */
  open(root: string, key: string): Promise<OpenedTemplatePackage>;
};
