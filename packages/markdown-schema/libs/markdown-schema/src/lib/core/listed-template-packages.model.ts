/**
 * What `TemplatePackagesPort.listed` made of the root's `markdownSchema.templatePackages`: the
 * keys in the order listed (none without the field or without a `package.json`), or why the field
 * is unusable.
 */
export type ListedTemplatePackages =
  { kind: 'listed'; keys: string[] } | { kind: 'refused'; message: string };
