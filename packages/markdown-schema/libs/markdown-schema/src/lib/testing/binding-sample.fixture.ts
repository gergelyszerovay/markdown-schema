/**
 * The files of a small tree: a `spec` template in a templates folder at the root, and
 * documents named for it at the root, in a package and in a library, beside a prose note that
 * binds to nothing.
 */
export const SAMPLE_FILES: Readonly<Record<string, string>> = {
  'layered-docs/1.index.md': '# Root index\n',
  'layered-docs/3.thing.spec.md': '# Spec: Thing\n',
  'layered-docs/4.broken.spec.md': '# Broken\n',
  'layered-docs/5.notes.workflow.md': '# Notes\n',
  'markdown-schema-templates/spec/spec.template.md': '# Spec: <!-- TEMPLATE-ONLY: string -->\n',
  'markdown-schema-templates/spec/spec.refine.ts': 'export default () => undefined;\n',
  'packages/foo/package.json': '{"name":"foo"}\n',
  'packages/foo/layered-docs/1.foo.spec.md': '# Spec: Foo\n',
  'packages/foo/libs/checkout/src/index.ts': 'export {};\n',
  'packages/foo/libs/checkout/layered-docs/1.checkout.spec.md': '# Spec: Checkout\n',
  'README.md': '# Readme\n',
};
