import type { TemplatePackage } from '../core/binding/template-package.model.ts';
import type { ListedTemplatePackages } from '../core/listed-template-packages.model.ts';
import type { OpenedTemplatePackage } from '../core/opened-template-package.model.ts';
import type { TemplatePackagesPort } from '../core/template-packages.port.ts';

/** An in-memory template-packages port, and the calls it saw. */
export type TemplatePackagesFake = {
  templatePackages: TemplatePackagesPort;
  /** The roots `listed` was asked about, in order. */
  listedCalls: string[];
  /** The keys `open` was asked about, in order. */
  openCalls: string[];
};

/**
 * Creates a template-packages port over packages arranged in memory: each package's directory is
 * `/packages/<key>`, a key it does not know is refused naming it, and the list is the one given.
 * @param options - `listed` is the root's list (or the message its refusal carries), `packages`
 *   the package-relative files of each key's template folders, and `refused` the keys whose
 *   opening is refused with the message given.
 * @returns The fake.
 */
export function makeTemplatePackagesFake(
  options: {
    listed?: readonly string[] | { refused: string };
    packages?: Readonly<Record<string, readonly string[]>>;
    refused?: Readonly<Record<string, string>>;
  } = {},
): TemplatePackagesFake {
  const listedCalls: string[] = [];
  const openCalls: string[] = [];
  const templatePackages: TemplatePackagesPort = {
    listed: (root): Promise<ListedTemplatePackages> => {
      listedCalls.push(root);
      const listed = options.listed ?? [];
      return Promise.resolve(
        'refused' in listed
          ? { kind: 'refused', message: listed.refused }
          : { kind: 'listed', keys: [...listed] },
      );
    },
    open: (_root, key): Promise<OpenedTemplatePackage> => {
      openCalls.push(key);
      const refusal = options.refused?.[key];
      const paths = options.packages?.[key];
      if (refusal !== undefined) return Promise.resolve({ kind: 'refused', message: refusal });
      if (paths === undefined) {
        return Promise.resolve({
          kind: 'refused',
          message: `Error: template package ${key} is not declared`,
        });
      }
      const templatePackage: TemplatePackage = { package: key, paths: [...paths] };
      return Promise.resolve({ kind: 'opened', templatePackage, directory: `/packages/${key}` });
    },
  };
  return { templatePackages, listedCalls, openCalls };
}
