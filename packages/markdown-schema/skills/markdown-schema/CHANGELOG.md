# Changelog: markdown-schema

Release notes for those who consume a version.

## Unreleased

## 0.1.4

### Changed

- **The skill's folder in the package is `skills/markdown-schema/`.** Its content is unchanged.

## 0.1.3

### Changed

- **The skill starts from example documents.** A new workflow derives a template from 2–5 filled documents: which
  sections are required, optional or unordered, which body shape and directive fits each value, when a rule belongs in
  a `*.refine.ts`, and how to check the result against the documents in the template's `examples/`.
- **The skill names the package `markdown-schema`** and installs it with one line; the registry setup is gone.
- **The traps are written down.** `remove-if` needs `optional`, and `only-if` needs `optional` (the decision table
  showed both without it); a `guide` between list items drops the next field; only the first H3's directive counts and
  group bodies are not checked; a leftover `TEMPLATE-ONLY` in an optional field validates and is why the final grep is
  mandatory; template errors carry a literal `template.md:` position.
- **One error table, with the messages `validate-md` prints.** The workflows and the table of messages live in
  `SKILL.md`; `markdown-schema.guideline.md` is the grammar reference only (its filling workflow, checklist and error
  section are gone). Filling starts by copying the template; `generateSkeleton` and `generateDocument` are the code path,
  with the repeated-group caveat.
- **The binding guideline is complete and generic.** It describes binding by name and proximity, the capitals
  fallback (`CHANGELOG.md` → `changelog`), the `ambiguous` status, `--root`, that a template's `examples/` are validated
  against it, which symbolic links count, and the `.refine.js` fallback of `loadRefine`. Its refine section gives generic advice on refines that need Node, and names no other tool.

## 0.1.2

### Changed

- **The template-structure guideline names no other tool.** Its note on binding says any tool can import the
  same rules, and its file-name example is `2.billing.constitution.md`.

## 0.1.1

### Changed

- **The skill names the package by its current name.** The skill's install line and its examples use the name of the
  package that holds `validate-md` and the template engine. The workflows are unchanged.

## 0.1.0

### Added

- **The skill.** Author, fill or validate `*.template.md` files with the `validate-md` CLI: designing a template,
  completing it with real content, validating a document against it, and debugging a `validate-md` error message; the
  template grammar guideline and the template-structure and binding guideline.

### Changed

- **The skill says how to install the package.** It gives the install command and the `validate-md` invocations.
