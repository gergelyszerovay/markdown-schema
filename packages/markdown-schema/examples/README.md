# Examples

Small, self-contained samples of the markdown-schema template language. Each folder holds a
template (or a TypeScript schema), a filled document that validates against it, and the parsed
JSON in `output/`. Run the commands from `packages/markdown-schema/` after `pnpm build`.

| Example                           | What it shows                                                                                                                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`release-notes/`](release-notes/) | A small template in the catalog layout: `markdown-schema-templates/release-notes/release-notes.template.md`, a sample in the template's own `examples/`, and `release-notes.md` bound by name |
| [`component/`](component/)         | A component spec: labeled lists, tables, `only-if`, `remove-if`, repeated H3 groups, and a `component.refine.ts` cross-section rule                                                            |
| [`all-features/`](all-features/)   | Every directive of the grammar in one template, each section explained by its `guide` block                                                                                                   |
| [`programmatic/`](programmatic/)   | The same kind of schema written in TypeScript with `defineDocSchema` instead of a template                                                                                                    |

```sh
# Directory mode: binds release-notes.md and the template's own examples/ by name and proximity
node bin/validate-md.mjs examples/release-notes

# Single-template mode, writing the parsed document as JSON
node bin/validate-md.mjs --template examples/release-notes/markdown-schema-templates/release-notes/release-notes.template.md \
  --emit-json examples/release-notes/output/release-notes.json examples/release-notes/release-notes.md
node bin/validate-md.mjs --template examples/component/component.template.md \
  --emit-json examples/component/output/component.json examples/component/example.md
node bin/validate-md.mjs --template examples/all-features/all-features.template.md \
  --emit-json examples/all-features/output/all-features.json examples/all-features/all-features.md

# Programmatic mode: validate-md reads templates only, so the schema runs in code
node examples/programmatic/run.ts > examples/programmatic/output/release.json
```

In a project that installs the package, the command is `validate-md` (`pnpm exec validate-md`).
