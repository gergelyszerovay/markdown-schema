/**
 * The extensions a template's refine companion `<name>.refine.<extension>` can have, in the order
 * they are looked for: TypeScript (stripped by Node, not under `node_modules`), then compiled
 * JavaScript.
 */
export const refineExtensions: readonly string[] = ['ts', 'js', 'mjs'];
