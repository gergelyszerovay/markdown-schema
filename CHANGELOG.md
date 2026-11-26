# Changelog: markdown-schema

Release notes of the markdown-schema group, one section per release, generated from the changelogs of its packages by `release-changelog --group`. Do not edit it by hand.

## Unreleased

## 0.13.9

### Changed

- **markdown-schema: The README names `install-package-skills`** as the way to install the skill from the npm package.

## 0.13.8

### Changed

- **markdown-schema: The skill ships from `skills/`.** The package's `markdown-schema` skill moved from `.claude/skills/` to `skills/`;
  the `./skills/*` export is unchanged, so installing it with `package-skills` or `npx skills add` works as before.

## 0.13.7

### Changed

- **markdown-schema: The examples show what the docs describe.** `examples/README.md` lists the four examples with the commands that
  validate them. `release-notes/` is laid out as a catalog (`markdown-schema-templates/release-notes/`, with a sample
  in the template's own `examples/`), so `validate-md examples/release-notes` shows directory mode. The `all-features`
  template now covers every directive (the `document` directive, the summary, a `key` and a `checkbox` column, task-list
  `min-items`/`max-items`/`regex`, `min-groups`/`max-groups`), and its optional-field guide says what holds: a field may be
  blank or its line removed, but the list keeps one item. The `component` template puts its H3 directive on the first
  H3 (the only one that counts), uses `guide` blocks for its placeholders, and leaves `remove-if Type=View` and
  `only-if Type=Primitive` to the directives: its `component.refine.ts` keeps only the event-reference rule.

- **markdown-schema: The README quotes what `validate-md` prints.** A template error reads `Error: invalid template <file>: …`, with a
  literal `template.md:<line>:<col>:` where the directive text is malformed; `remove-if` is shown with `optional`; the
  catalog rule says which symbolic links count; the agent skill section lists the workflow that derives a template
  from example documents.

## 0.13.6

### Changed

- **markdown-schema: The README is the complete guide, written for npm.** It names the package `markdown-schema`, installs it from
  npm, covers the template directives, frontmatter, the CLI, the entry points, the API and security notes, and shows
  how to install the agent skill with `package-skills` or `npx skills add`.

- **markdown-schema: Published to npm as `markdown-schema` again.** From this version the package is `markdown-schema` on npm,
  continuing from 0.2.0; install it with `npm i markdown-schema`.

## 0.13.5

No changes for users of the package.

## 0.13.4

No changes for users of the package.

## 0.13.3

### Changed

- **markdown-schema: The package is developed in its own repository.** Its `repository` field names the public repository
  `gergelyszerovay/markdown-schema` (folder `packages/markdown-schema`); `prepublishOnly` builds the package with
  `pnpm run build`. Nothing in the package's API, bins or files changes.

## 0.13.2

### Fixed

- **markdown-schema: A template's compiled `<name>.refine.js` is loaded when there is no `<name>.refine.ts`.** Node refuses to strip types
  of a file under `node_modules` (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`), so a package that ships templates ships
  plain JavaScript refine files; `validate-md` and the template catalog (`hasRefine`) now find them. A `.refine.ts` still
  wins where both exist.

## 0.13.1

### Changed

- **markdown-schema: The `architecture` binding in `package.json` names the profile only.** The `version` of `node-block-architecture`
  is gone from it: the package is checked against the installed profile.

## 0.13.0

### Changed

- **Breaking:** **markdown-schema: The package is `@gergelyszerovay/markdown-schema`.** It was `@gergelyszerovay/reviewer2-markdown-schema`;
  the old name has no further release and no deprecation notice. Replace the name in `package.json` and in every import
  (`@gergelyszerovay/markdown-schema`, `@gergelyszerovay/markdown-schema/node`). The `validate-md` command, the
  `markdown-schema` skill and the API are unchanged.
- **markdown-schema: The package's folder in the repository moved.** `repository.directory` follows the move.
