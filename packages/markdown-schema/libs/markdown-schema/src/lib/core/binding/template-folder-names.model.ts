/** The canonical name of a folder that holds templates. */
export const templateFolderName = 'markdown-schema-templates';

/** The name older revisions used for a folder that holds templates; it is still read. */
export const legacyTemplateFolderName = 'layered-doc-templates';

/** Every name a templates folder can have, canonical first. */
export const templateFolderNames: readonly string[] = [
  templateFolderName,
  legacyTemplateFolderName,
];
