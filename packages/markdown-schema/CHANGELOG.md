# Changelog: markdown-schema

Release notes for those who consume a version.
(On npm the package is `markdown-schema`; its versions continue from 0.2.0.)

## Unreleased

## 0.13.9

### Changed

- **The README names `install-package-skills`** as the way to install the skill from the npm package.

## 0.13.8

### Changed

- **The skill ships from `skills/`.** The package's `markdown-schema` skill moved from `.claude/skills/` to `skills/`;
  the `./skills/*` export is unchanged, so installing it with `package-skills` or `npx skills add` works as before.

## 0.13.7

### Changed

- **The examples show what the docs describe.** `examples/README.md` lists the four examples with the commands that
  validate them. `release-notes/` is laid out as a catalog (`markdown-schema-templates/release-notes/`, with a sample
  in the template's own `examples/`), so `validate-md examples/release-notes` shows directory mode. The `all-features`
  template now covers every directive (the `document` directive, the summary, a `key` and a `checkbox` column, task-list
  `min-items`/`max-items`/`regex`, `min-groups`/`max-groups`), and its optional-field guide says what holds: a field may be
  blank or its line removed, but the list keeps one item. The `component` template puts its H3 directive on the first
  H3 (the only one that counts), uses `guide` blocks for its placeholders, and leaves `remove-if Type=View` and
  `only-if Type=Primitive` to the directives: its `component.refine.ts` keeps only the event-reference rule.

- **The README quotes what `validate-md` prints.** A template error reads `Error: invalid template <file>: …`, with a
  literal `template.md:<line>:<col>:` where the directive text is malformed; `remove-if` is shown with `optional`; the
  catalog rule says which symbolic links count; the agent skill section lists the workflow that derives a template
  from example documents.

## 0.13.6

### Changed

- **The README is the complete guide, written for npm.** It names the package `markdown-schema`, installs it from
  npm, covers the template directives, frontmatter, the CLI, the entry points, the API and security notes, and shows
  how to install the agent skill with `package-skills` or `npx skills add`.

- **Published to npm as `markdown-schema` again.** From this version the package is `markdown-schema` on npm,
  continuing from 0.2.0; install it with `npm i markdown-schema`.

## 0.13.5

No changes for users of the package.

## 0.13.4

No changes for users of the package.

## 0.13.3

### Changed

- **The package is developed in its own repository.** Its `repository` field names the public repository
  `gergelyszerovay/markdown-schema` (folder `packages/markdown-schema`); `prepublishOnly` builds the package with
  `pnpm run build`. Nothing in the package's API, bins or files changes.

## 0.13.2

### Fixed

- **A template's compiled `<name>.refine.js` is loaded when there is no `<name>.refine.ts`.** Node refuses to strip types
  of a file under `node_modules` (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`), so a package that ships templates ships
  plain JavaScript refine files; `validate-md` and the template catalog (`hasRefine`) now find them. A `.refine.ts` still
  wins where both exist.

## 0.13.1

### Changed

- **The `architecture` binding in `package.json` names the profile only.** The `version` of `node-block-architecture`
  is gone from it: the package is checked against the installed profile.

## 0.13.0

### Changed

- **Breaking:** **The package is `@gergelyszerovay/markdown-schema`.** It was `@gergelyszerovay/reviewer2-markdown-schema`;
  the old name has no further release and no deprecation notice. Replace the name in `package.json` and in every import
  (`@gergelyszerovay/markdown-schema`, `@gergelyszerovay/markdown-schema/node`). The `validate-md` command, the
  `markdown-schema` skill and the API are unchanged.
- **The package's folder in the repository moved.** `repository.directory` follows the move.

## 0.12.0

### Added

- **A file name in capitals binds to the lower-case template.** In directory mode, `CHANGELOG.md` asks for the template
  `CHANGELOG` and, when no template has that name, for `changelog` (likewise `README.md` and `readme`); only a name that
  is all upper case falls back, so `Plan.md` is not mixed up with `plan.md`. A capital-letter file that had no template of
  its own name stays unbound unless a lower-case template of that name exists in its reach.
- **The package exports its skill.** `"./skills/*": "./.claude/skills/*"` lets a tool that installs skills from
  packages find the `markdown-schema` skill in an installed copy. Additive.
- **`source` export conditions name the TypeScript entries.** A tool that reads the workspace's sources resolves the two
  entries to their `.entry.ts` blocks; the published entries are unchanged.

### Changed

- **The package's folder in the repository moved.** `repository.directory` and `prepublishOnly` follow the move; nothing a
  consumer runs changes.

## 0.11.0

### Added

- **A template link that stands for no template is named.** In directory mode, a link `<templates folder>/<name>` to a
  folder inside the root where no `<name>.template.md` could be read prints a `Warning: template link ...` line, and
  `--json` carries it in `unreadTemplateLinks`; until now its documents were silently counted as unbound. The exit code
  does not change.
- **`DirectoryPort.listScope`** is new (`list` stays); `makeDirectoryFake` gains `scopeCalls`.

### Changed

- **Published to GitHub Packages.** `publishConfig.registry` names `https://npm.pkg.github.com`; the README and the skill
  say how a repository maps the `@gergelyszerovay` scope and where the token goes.
- **Breaking:** **Directory mode reads only what a binding can depend on.** Breaking for an implementer of `DirectoryPort`;
  a behaviour change for `validate-md` runs on the root. `validate-md <path>` lists the requested paths and the templates
  folder of each of their ancestors instead of the whole tree under the root. A path that is the root of a Git work tree is
  listed through `git ls-files --cached --others --exclude-standard`, so ignored folders are never visited. For a root run
  inside Git, gitignored files, nested repositories and submodules are no longer listed, so a document there is no longer
  validated (a folder run still walks the disk and does include them). Otherwise every binding, ambiguity and unbound file
  is the one the full walk gave.

## 0.10.0

### Changed

- **Breaking:** **`generateDocument` validates its data first.** Breaking for a caller that relied on invalid data being
  written. The data is checked against the template's shape and invalid data throws an `Error` listing every failure, each
  naming the section and field, before anything is written. A wrong-typed value is refused instead of being written as
  something else (a checkbox cell of `'yes'`, `1` or `null`, a non-string text cell or title, a task item with a
  non-boolean `checked`, a key the template does not declare). `generateDocument(shape, data, { validate: false })` skips
  the check. Valid data produces the same text as before. `generateSkeleton` is unaffected.
- **The JSON Schema says what it describes.** Each section's schema carries a `description` from its heading;
  `templateJsonSchema(shape, { name })` also gives the root a `title`, a `description` and an `$id`, and
  `validate-md --emit-schema` passes the template's name.

## 0.9.0

### Added

- **Generation.** `generateDocument(shape, data)` renders `DocumentData` to markdown, and `generateSkeleton(shape)` writes
  a skeleton from the shape alone. Both are pure and on the `.` entry. For any `data` that validates against a template,
  `parse(generateDocument(shape, data))` deep-equals `data`. Tables are written unaligned; cell values are escaped plain
  text, so links in generated cells are not supported. There is no CLI command.
- **Task-list item rules.** A task-list section's `section` directive accepts `min-items: N`, `max-items: N` and a `regex`
  for each item's text; the shape, the validation and the JSON Schema carry them. On any other kind of section they are a
  template error.
- **Checkbox columns.** A `row` directive column declared `Header: checkbox` holds `[ ]` or `[x]` and is read as a boolean;
  any other cell text is a validation issue, and the JSON Schema types the column `boolean`. `SectionValue` table rows are
  now `Record<string, string | boolean>[]`.

### Changed

- **Breaking:** **The published shape model is widened.** Code that builds a `TemplateShape` by hand or reads `ColumnShape`
  and a table's `columns` must follow. `TitleShape` keeps the parts beside the validating `pattern`; `SummaryShape` gains
  `kind: 'field'`; `ColumnShape` gains `kind: 'text' | 'enum' | 'checkbox'`; a table body always carries `columns` plus
  `declared: boolean`.
- **`DocumentData` (type only).** The intersection that rejected an object literal with non-string frontmatter is replaced
  by an index signature of `unknown`; the parse output is unchanged at runtime.

## 0.8.0

### Added

- **The template shape.** `parseTemplate(...)` returns `shape: TemplateShape` next to `parse` and `keyColumns`: everything
  the template's directives declare, as plain data. The shape types are exported from the `.` entry.
- **Published value types.** `DocumentData` names the parse output and `SectionValue` what each section kind extracts;
  `parse` is declared to return `DocumentData`. At runtime the object is the same as before, plus the new `summary` key
  where a template declares one.
- **JSON Schema.** `templateJsonSchema(shape)` describes the `DocumentData` a template emits as a draft 2020-12 schema, and
  `validate-md --template <t> --emit-schema` prints it. It documents the structural contract only (not refine companions,
  `only-if`/`remove-if` conditions or cross-document uniqueness of `key` columns).

### Changed

- **The summary directive is validated.** The `>` blockquote between the H1 and the first section carrying an inline field
  directive is now compiled like a field: required or optional as written, checked against its regex, and extracted as
  `summary`. It was previously skipped without validation. A template without the directive behaves as before.

## 0.7.0

### Added

- **`parse(raw, { tree })`.** A compiled template's `parse` accepts an already-parsed mdast tree of the document next to
  its text, so a caller that also reads the tree does not parse the document twice. Every existing call behaves as before.
- **`parseTemplateAsync`.** Compiles a template like `parseTemplate`, but analyses the template's regex patterns together
  without blocking the event loop once per pattern. An unsafe pattern is rejected with the same message. `parseTemplate` is
  unchanged. The `ParsedTemplate` type names what both return.

## 0.6.0

### Added

- **`document` directive.** A template may declare, between its H1 and its first H2,
  `<!-- TEMPLATE-ONLY: document; open; unordered -->`. `open` accepts a `##` section the template doesn't declare and parses
  it as free text into the document's `additionalSections`; `unordered` accepts the declared sections in any order. A
  second `document` directive, or one inside a section, is a template error. A template without one validates as before.

## 0.5.0

### Added

- **Directory mode.** `validate-md [<path>...] [--root <dir>] [--ignore <dir-or-path>]... [--no-refine] [--json] [--verbose]`
  lists a directory once, builds the template catalog, binds every Markdown file to its template by file name and tree
  proximity, and validates each bound document. Templates are collected under `--root` (default: the nearest ancestor
  holding `.git`, else the current directory). `.git`, `node_modules`, `dist` and what `--ignore` names are skipped, and
  symlinks are never followed. Exit code 0 when everything bound validates and nothing is ambiguous; 1 otherwise. `--json`
  prints the whole result. `validate-md --template ...` behaves as before; without `--template` the command is now
  directory mode instead of a usage error, and an empty command line, `--help` and `-h` print the usage and exit 0.
- **Binding conventions.** The `.` entry exports the rules directory mode uses, as pure functions over a path list:
  `listTemplates`, `bindDocuments`, `templateNameOf` and the template folder names, with their result types. Templates
  live in `markdown-schema-templates/<name>/` (the legacy `layered-doc-templates/` is still read).

## 0.4.0

### Added

- **`key` column modifier.** A `row` column declared `string; key` marks the column whose values identify the rows of its
  table. It implies `required`. Key values are unique across every key column of a document, so a duplicate is a
  validation error. `key; optional` and `key; default=` are template errors.
- **`parseTemplate` reports `keyColumns`.** The new `listRowKeys(data, keyColumns)` lists a parsed document's keys, each
  with the field of its row, and the `.` entry exports it.

## 0.3.0

### Added

- **`cellText` is exported** from the browser-safe `.` entry, so programmatic consumers can match the built-in extractors
  on link and citation cells.

### Changed

- **Breaking:** **The package was renamed.** It is published as `@gergelyszerovay/reviewer2-markdown-schema`; the unscoped
  `markdown-schema` stays at 0.2.0 for its existing users. Consumers change only the package name: the `.` and `./node`
  entries export exactly what 0.3.0 of `markdown-schema` exports, and `validate-md` takes the same arguments and gives the
  same output and exit codes. The `validate-md` binary is a committed entry that loads the built `dist/validate-md.main.mjs`,
  so package managers can link it before the first build.
- **Breaking:** **Validation is stricter.** For filled documents that were only passing because the engine silently
  tolerated violations.
  - Unknown extra `##` sections, undeclared labeled-list keys, and duplicate `##` headings are hard errors.
  - Section order is enforced. Disable with `parseTemplate(raw, { orderedSections: false })`.
  - A `string; required` table column rejects empty cells.
  - A present-but-malformed optional `table`/`freetext` section fails instead of validating as `undefined`.
- **Breaking:** **The directive grammar fails closed.**
  - Unknown modifiers on `string` fields, `enum:`, `row`/`section` openers and column specs are `DirectiveError`s.
  - `min-rows` / `max-rows` / `min-groups` / `max-groups` reject non-integer or negative values.
  - A `regex` modifier without backticks is rejected.
  - `required` combined with `only-if` or `default=` is rejected as contradictory.
  - A wrong directive kind for a position is a hard error.
  - `<!--TEMPLATE-ONLY:` (no leading space) can no longer bypass the inline-must-close check.
  - Reference-style links (`[label][ref]`) in a value cell are rejected; use an inline link `[label](path)`.
- **Link-aware cell extraction is documented and versioned.** A link in a fill value stringifies to its URL, so document
  path citations reach refines while rendering as native links. `DirectiveError` prefixes messages with `path:line:col:`
  when a position is supplied.

### Fixed

- **`default=` is applied.** A blank or absent optional field or table cell is filled with its declared default before
  validation, and the default appears in the emitted JSON. Empty `default=` means "blank allowed".
- **`remove-if Key=Value` is enforced.** When the referenced labeled-list field equals the value and the guarded section
  is present, validation fails. The key must be declared in exactly one labeled-list section.

## 0.2.1

### Changed

- **Cell extraction is link-aware.** A Markdown link in a fill value stringifies to its URL (not its label); header cells,
  headings and titles keep label stringification.
- **The `system-overview` template is renamed `overview-diagram`.**

## 0.2.0

### Removed

- **The `--schema` and `--export` CLI flags.** Use `--template <file.template.md>` instead; the CLI is template-mode only.
