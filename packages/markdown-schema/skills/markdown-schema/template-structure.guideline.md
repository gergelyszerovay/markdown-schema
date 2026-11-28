# Template Structure & Binding Guide

How `*.template.md` files are organized, how a document finds its template
(the **catalog** and **proximity binding**), and which `*.refine.ts` rules need
a Node filesystem.

This is the layer _above_ the directive grammar. For what goes _inside_ a
single template, read `markdown-schema.guideline.md`. This file covers how
templates are laid out as files and found from a document.

> **Engine vs. convention.** The template engine (`parseTemplate` and the
> extractors) has **no** notion of binding, and `loadRefine` only looks for a
> sibling `<stem>.refine.ts` (else a compiled `<stem>.refine.js` or `.refine.mjs`). The catalog and
> proximity rule below are a convention the package implements once, as pure rules
> over a path list (`listTemplates`, `bindDocuments`), and uses in `validate-md`'s
> directory mode (`validate-md <path>`); a tool that binds documents itself can
> import the same rules. The folder anatomy and the refine filesystem model, by
> contrast, _are_ engine-true.

---

## 1. Template folder anatomy

Each template is a folder named after the template. The folder name is the
**template name** (e.g. `plan`, `release-notes`, `changelog`).

```
<name>/
  <name>.template.md     # REQUIRED — the template (directive grammar)
  <name>.refine.ts       # OPTIONAL — cross-section rules (named `refine` export)
  examples/              # OPTIONAL — filled sample docs
    <something>.md       #   a valid filled instance, validated against the template
```

Rules:

- **`<name>.template.md` is the only required file.** Its stem must equal the
  folder name (`plan/plan.template.md`).
- **`<name>.refine.ts` is a sibling, same stem.** `loadRefine` derives its path
  by replacing `.template.md` with `.refine.ts` in the same directory, and falls
  back to `<name>.refine.js`, then `<name>.refine.mjs`, when there is no `.ts`
  file. Node does not strip the types of a file under `node_modules`, so a package
  that ships templates ships the compiled `.refine.js`; a `.refine.ts` in a
  listed template package is a template error. A different name will not be found.
- **`examples/*.md` are filled instances**, not templates — they contain no
  `<!-- TEMPLATE-ONLY: -->` directives. Any filename is allowed. Directory mode
  validates every one of them against the template whose folder holds them, so
  they double as regression checks: keep only documents that pass there.

---

## 2. The catalog

The **catalog** is every `markdown-schema-templates/<name>/<name>.template.md`
under the root. A folder whose stem does not match its name is not a template.
A symbolic link `<templates folder>/<name>` to a directory that holds
`<name>.template.md` counts as that template, and the template is read through
the link, so a folder of relative links can share templates that live
elsewhere, such as in skills. Other symbolic links are not followed: a templates
folder that is itself a link, a link to a template file, or a link whose way
crosses another link or a skipped folder (`node_modules`, `dist`) is not a
template. A link that stands for no template is printed as a
`Warning: template link …` line.

### Template packages

The templates of an installed package join the catalog when the root
`package.json` lists the package:

```json
{
  "devDependencies": { "@acme/doc-templates": "^1.2.0" },
  "markdownSchema": { "templatePackages": ["@acme/doc-templates"] }
}
```

- Each entry is the key of a dependency the root declares (an npm alias by its
  key). An entry the root does not declare, or that is not installed, stops the
  run with an error naming it. No field, or `[]`, reads no package.
- Only the package's `markdown-schema-templates/<name>/` and
  `skills/<skill>/markdown-schema-templates/<name>/` folders are read, from
  `<root>/node_modules/<key>` (which may be a link; nothing inside the package
  is followed).
- A package template is printed as `<key>/<path in the package>`, in the text
  output and in `--json`.
- `--template-package <key>` (repeatable) adds a package for one run;
  `--no-template-packages` reads none.
- Prefer the list to a folder of links or a copied catalog: it needs no
  generated files, and a template of the same name in the root's own folder
  still overrides the package's.

## 3. Binding by name and proximity

Every Markdown file in scope is a document. A file named
`[<n>.][<artifact>.]<template>.md` binds to the closest template of that name:

- The **template name** is the last segment of the file name, after dropping a
  leading `<n>.` level number: `2.billing.constitution.md` → `constitution`,
  `plan.md` → `plan`, `README.md` → `README`.
- **Capitals fall back to lower case.** A name written in capitals asks for the
  template of that name and, when no template has it, for the lower-case one:
  `CHANGELOG.md` binds to `changelog`.
- **Proximity:** walk up from the document's directory, up to the root. At each
  ancestor, only its own templates folder is looked in (not its subtree); the
  first ancestor that has a template of that name decides, so a closer template
  shadows a farther one of the same name. The **listed packages** come after the
  root's own folder: a package template binds only when no folder of the tree has
  the name.
- **The root** is `--root`, else the nearest ancestor holding `.git` (a directory
  or a file, so worktrees count), else the current directory. The paths you
  validate must lie inside it; a document may bind to a template outside those
  paths, as long as it is under the root.
- The result is `bound` (with the template's path), `unbound`, `template` (a
  file inside a templates folder: never bound itself, except the template's
  `examples/`, which are validated against it) or `ambiguous` (the closest level
  holds different templates of that name; the run fails and lists the
  candidates). In the tree, with one templates folder per directory, the rules do
  not produce `ambiguous`; two package templates of one name (two listed
  packages, or two skills of one) do, unless a folder of the tree decides first.

Consequences:

- **A template must sit in an ancestor's own folder, or in a listed package.** A template
  in a sibling or a distant folder never captures a document. To use the templates of an
  installed package, list it (**Template packages** above). To use templates that live
  elsewhere in the tree (in a skill, say), put a folder `markdown-schema-templates/` in an
  ancestor of the documents and fill it with relative symlinks, one per template
  (`node-lib -> ../../skills/x/markdown-schema-templates/node-lib`).
  `validate-md <path>` binds by this rule; a tool that takes an explicit path
  (`validate-md --template <path> <doc>`) never needs binding.
- **To see a binding**, run `validate-md <file> --json`: each entry of `documents`
  names its `templatePath`. `--verbose` lists the unbound files.

---

## 4. Refine rules and the filesystem

A refine is code: it receives the parsed document (`doc`) and may read anything
else it imports. A refine that reads only `doc` and calls `ctx.addIssue` runs
anywhere — in `validate-md`, in a Node service, in a browser bundle. One that
reads the file system (to check that a path or a package a document names
exists, say) runs only where a file system is: it cannot run in a browser
bundle.

- **Prefer refines that read only `doc`.** Put what the rule needs into the
  document when you can.
- **Say so in the refine's header comment** when one needs Node, so a consumer
  that bundles templates for the browser knows to validate those documents in
  Node or to skip the refine.
- **`--no-refine`** makes `validate-md` skip refines; the structural and
  directive checks still run. Use it for untrusted templates as well: loading a
  refine executes its code.
