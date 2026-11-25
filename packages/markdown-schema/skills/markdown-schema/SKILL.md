---
name: markdown-schema
description: Derive, author, fill, or validate `*.template.md` files. Use when the user wants to derive a template from a few example documents, design or change a template, complete (fill) a template with real content, validate a filled document against its template using the `validate-md` CLI, or debug a `validate-md` error message. Covers these four workflows, and where templates live and how documents bind to them, for the `markdown-schema` package.
metadata:
  version: '0.1.4'
---

# Skill: markdown-schema

Read `markdown-schema.guideline.md` next to this SKILL.md. It is the reference for the
directive grammar — `string`, `enum:`, `row`, `section`, `freetext`, `document`, `guide`,
and how they nest inside `<!-- TEMPLATE-ONLY: -->` comments.

For how templates are laid out as files and how a document finds its template — folder
anatomy, the catalog, binding by name and proximity (the closest templates folder that has
a template of the document's name decides), and refines that need Node — read
`template-structure.guideline.md` (summarized in section **E** below).

This skill covers these workflows. Pick the section matching the user's task.

## The package

Install `markdown-schema` where documents are validated:

```sh
pnpm add -D markdown-schema
pnpm exec validate-md <path>                                   # every bound document under a path
pnpm exec validate-md --template <template-file> <filled-doc>  # one document, one template
pnpm exec validate-md --template <template-file> --emit-schema # the template's JSON Schema
```

```ts
import { parseTemplate } from 'markdown-schema'; // browser-safe
import { loadRefine } from 'markdown-schema/node'; // reads the file system
```

## Trigger

Use this skill when the user asks to:

- **Derive** a template from example documents — "make a template from these files",
  "these documents should all follow one shape". See section **A**.
- **Author** a template — design, create, or modify a `*.template.md` file;
  add or split sections/columns; choose a directive kind; write a
  cross-section `*.refine.ts` rule.
- **Fill** a template — replace `<!-- TEMPLATE-ONLY: -->` directives with
  real content; complete a partially filled document; debug why
  `validate-md` rejects a filled instance.
- **Validate** a document — run `validate-md`; interpret or debug its error
  output; check whether a filled document satisfies the template.
- **Organize / locate** templates — create a new template folder; decide
  which templates folder it belongs in; understand which template a document
  binds to. See section **E**.

---

## A. Deriving a template from example documents

The usual way to get a template: the documents already exist (or an agent drafted a few), and
the template captures the shape they share. Work from the documents, not from a blank page.

1. **Collect 2–5 filled documents** of the kind. One document hides which parts vary; more
   than five rarely adds anything.
2. **Sections (H2).** List the `##` headings of every document.
   - In every document → a required section (no directive needed).
   - In some documents only → `<!-- TEMPLATE-ONLY: section; optional -->` under the H2.
   - Same headings, different order → `<!-- TEMPLATE-ONLY: document; unordered -->` after the H1.
   - Each document adds sections of its own → `document; open` (undeclared sections are
     accepted as free text), alongside the sections they share.
   - The heading text is the section's key, so keep it fixed; the number prefix may stay
     (`## 2. Classification`).
3. **Body shape per section.** Look at what each section holds in every document:
   - `- Label: value` bullets → a labeled list, one inline directive per label.
   - a GFM table → a table with a `row` block directive.
   - `- [ ]` / `- [x]` items → a task list.
   - `###` sub-headings, one per item → repeated groups.
   - plain bullets → a plain list (each item is a string).
   - anything else (prose, code, mixed) → `<!-- TEMPLATE-ONLY: freetext; required -->`.
4. **Values.** For each field or column, compare its values across the documents:
   - identical text everywhere → a constant: leave it as plain Markdown (labels, headers).
   - a small closed set (`Draft`, `Accepted`, …) → `enum: A | B | C; required`.
   - a consistent format (IDs, versions, dates) → `string; regex \`^…$\`; required`.
   - free text → `string; required`.
   - sometimes blank → `string; optional`, or `default=<value>` when blank means a
     known value.
   - present only when another field has a value → `string; optional; only-if Key=Value`.
5. **Tables.** Write the header row, the separator row, then a `row` block with one column spec
   per header, then one sample row. A column of identifiers → `string; key` (unique across the
   document, citable as `<doc>#AC-1`); a column of `[ ]`/`[x]` → `checkbox`. Set `min-rows` to
   the row count of the smallest document (usually 1); `max-rows` only when a limit is real.
6. **Repeated groups and task lists.** Put the heading directive on the **first** `###`; it
   applies to every group, and `section; min-groups: N` bounds their number. Group bodies are not
   checked beyond being a bullet list (see the guideline). For a task list, `section; min-items: N;
regex \`…\`` bounds the items.
7. **Cross-section rules.** A relation that holds in every document and spans two sections
   (every event named in one section is declared in a table of another) cannot be a directive:
   write it in `<name>.refine.ts` and add one `//` line for it to the opening `guide` block. A
   section that must be absent when a field has a value is a directive, not a refine:
   `section; optional; remove-if Key=Value`.
8. **Guidance.** Add `guide` blocks where a value's meaning or format is not obvious from the
   documents (what, why, when, an example).
9. **Save and check.** Save it as `markdown-schema-templates/<name>/<name>.template.md` (the folder
   name is the template name), and move the source documents into its `examples/` folder. Run
   `validate-md markdown-schema-templates/<name>`: the files in a template's own `examples/` are
   validated against it. Adjust the template until every one prints `OK` — loosen a directive only
   when a real document needs it.
10. **Negative fixtures.** Write one failing document per rule (a required section, an enum, a
    regex, each refine rule), outside `examples/` (they would fail directory mode), and check each
    with `validate-md --template <template> <doc>`: it must fail with the message you expect.

## B. Authoring a template

### Core principles

**Constants outside, variables inside.** Apply the "survives filling" test
to every span of text: if it appears character-for-character in every correctly
filled instance, it's a constant (leave as plain markdown). Otherwise it's a
variable (wrap in `<!-- TEMPLATE-ONLY: -->`).

**Enum-placeholder anti-pattern.** A list of values like `A | B | C` looks
like scaffolding but is actually a placeholder — the author picks one and
deletes the rest. It MUST be inside an `enum:` directive, not outside.

### Decision table: which directive to use

| Situation                                       | Directive                                            |
| ----------------------------------------------- | ---------------------------------------------------- |
| Author picks exactly one from a fixed list      | `enum: A \| B \| C; required`                        |
| Author writes a free-form string (required)     | `string; required`                                   |
| Author writes a free-form string (optional)     | `string; optional`                                   |
| Value must match a regex pattern                | `string; regex \`^...$\`; required`                  |
| Blank means a known value                       | `string; default=<value>`                            |
| Field is only valid when another field equals X | `string; optional; only-if Key=Value`                |
| Author-facing guidance (ignored by parser)      | `guide` block with `//`-prefixed lines               |
| Table where every row must conform to a schema  | `row; min-rows: N` block directive                   |
| Table column identifies the rows                | `ID: string; key` in the `row` block                 |
| Table column is a `[ ]` / `[x]` tick            | `Header: checkbox` in the `row` block                |
| Section or table may be absent                  | `<!-- TEMPLATE-ONLY: section; optional -->`          |
| Section must be absent when a field has a value | `section; optional; remove-if Key=Value`             |
| Section has sub-groups; need ≥ N groups         | `section; min-groups: N`                             |
| Task list needs N–M items, each matching a form | `section; min-items: N; max-items: M; regex \`...\`` |
| Section is free-form Markdown                   | `freetext; required`                                 |
| Sections may come in any order / extra sections | `document; unordered` / `document; open`             |
| One-line summary under the title                | `> <!-- TEMPLATE-ONLY: string; required -->`         |

Fields are required unless they say otherwise, so `only-if` needs `optional`: a field that is
both required and `only-if` is a template error. Combine `remove-if` with `optional` too;
without it the section is required and the rule cannot be met.

### Traps the engine does not catch

The template compiles, but a document is not checked the way the template suggests:

- **`remove-if` without `optional`.** `section; remove-if Type=View` makes the section required
  and forbidden at once when `Type` is `View`: no document with that value validates. Write
  `section; optional; remove-if Type=View`.
- **A `guide` block between list items.** It splits the list in two; the template keeps only
  the first part, so the fields after the guide are not declared and a document that fills them
  fails with `Unrecognized key "…": not declared in the template`. For a field in a labeled
  list, place the guide above the whole list, never between items.
- **A directive on a later H3.** In a repeated section only the first `###` heading's directive
  counts; one on the second or a later H3 is ignored, so the headings are not checked.
- **Leftover `TEMPLATE-ONLY` in a document.** A leftover `<!-- TEMPLATE-ONLY: string; optional -->`
  in an optional field (or a plain list item) validates `OK` and is parsed as the literal value.
  The final grep of the **Fill** workflow catches it.
- **Directive errors name `template.md`.** `validate-md` reports a template error as
  `Error: invalid template <file>: template.md:L:C: …`: the file is the first part, the
  `template.md:` before the line and column is literal.

### Boundary: what can't go in a directive

These invariants **cannot** be expressed as directives and belong in `*.refine.ts`:

- Set membership across two sections (e.g. event names in one section must
  appear in another section's table)
- Conditional requirements spanning more than one section (other than a section's
  absence, which `remove-if` expresses)
- Arithmetic on counts or values
- Pattern matching across free-form prose

### Writing a `*.refine.ts` companion

Rules:

- Filename: `<stem>.refine.ts` (sibling to `<stem>.template.md`); `loadRefine` also finds a
  compiled `<stem>.refine.js`
- Export: named `refine` function
- Signature: `(doc: unknown, ctx: z.core.$RefinementCtx) => void`
- Use `ctx.addIssue({ code: "custom", path: [...], message: "..." })` for each violation
- Read only `doc` where you can: a refine that reads the file system runs in Node only (see
  section **E**)

Working stub:

```ts
import type { z } from 'zod';

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;
  // Rule: ...
};
```

**Document rules in `guide` blocks.** Every cross-section rule enforced in
`*.refine.ts` MUST have a matching `// ...` line in a `guide` block at the
top of the template. Every `//` rule in the opening `guide` block MUST be
enforced by code in `*.refine.ts`. A rule that a directive already enforces
(`only-if`, `remove-if`) belongs in a guide next to its field or section, not in
the refine.

### Round-trip validation

After modifying a template:

1. Fill the template (use the **Fill** workflow below or do it manually).
2. Write at least one **negative fixture** per refine rule (a doc that violates the rule).
3. Run `validate-md <path>` over the template's `examples/` folder and the documents that bind to it
   (or `validate-md --template <template> <doc>` for one), on both happy and sad paths.
4. Confirm the error messages are actionable and point to the right path.

### Adding a column to an existing table

1. Add the column to the header row and separator row.
2. Add the column spec to the `row` directive block.
3. Add sample data for the column to the sample row.
4. Update all existing fixture files to include the new column.
5. Re-run `validate-md` on all example docs.

### Adding a new section

1. Add the H2 heading with the appropriate numbering.
2. Add a `<!-- TEMPLATE-ONLY: section -->` directive if the section is optional
   or has group constraints.
3. Add the body: table with `row` directive, labeled list with `string`/`enum:`
   directives, or a `freetext` directive.
4. Check the section's key. It is derived from the heading: a leading number (`1.`, `3.2.`), a
   trailing `(…)` and anything from a `/` on are dropped, and the words are camelCased
   (`## 4. Inputs (Props)` → `inputs`). Two headings with the same key are a template error.
5. If the section participates in cross-section invariants, update `*.refine.ts`
   and the opening `guide` block at the top of the template.

---

## C. Filling a template

### 1. Pre-flight

Start a document by **copying the template** and replacing each directive in place; that keeps
the fixed headings, labels, `###` group headings and guide text in view while you fill.

From code, `generateSkeleton(parseTemplate(template).shape)` writes a starting point (headings,
table header rows with a placeholder row, labeled-list keys, `<...>` placeholders), and
`generateDocument(shape, data)` writes a whole document from data that matches the template's
JSON Schema (`validate-md --template <template> --emit-schema`). Both are on the `markdown-schema`
entry (see **Generating a document** in `markdown-schema.guideline.md`). The skeleton keeps one
`### <...>` per repeated section: a template's fixed `###` headings (`### 3.1 MUST`) and the
bodies of its groups are not in it, so copy those from the template.

Before writing anything:

1. Read the `*.template.md` to understand the full schema.
2. Read the sibling `*.refine.ts` (if present) to understand cross-section invariants.
3. Read the opening `<!-- TEMPLATE-ONLY: guide -->` block at the top of the template
   for the prose list of cross-section rules, and every other `guide` block — that is where
   the template's author put guidance for you.

### 2. Fill each section

Work section by section, applying these rules per directive kind:

**`enum:` directive:**

- Write exactly one of the listed choices after the label colon (with `|` and `\` unescaped:
  the choice `A \| B` is written `A | B`).
- Delete the entire `<!-- TEMPLATE-ONLY: ... -->` inline block.
- Example: `- Type: View` (not `- Type: Root | Layout | View | ...`)

**Field directive (`string`):**

- Write the value after the label colon.
- Delete the `<!-- TEMPLATE-ONLY: ... -->` inline block.
- If `optional` and not applicable, either leave it blank after the colon or remove the line
  (a labeled list must keep at least one item).
- Respect `only-if <Key>=<Value>`: only include the field when the named field equals the given value.

**`row` directive (table):**

- Replace the sample rows with real data rows.
- Delete the `<!-- TEMPLATE-ONLY: row ... -->` block (it sits between the separator and the sample row).
- Respect `required` columns (must have a value) and `enum: A | B` columns (value must be one of the choices).
- Respect `min-rows: N` — the table needs at least N data rows.
- A `key` column's values are unique across the whole document; a `checkbox` column's cell is exactly `[ ]` or `[x]`.
- A link in a cell is an inline link `[label](path)`; a reference-style link `[label][ref]` is rejected.

**`section` directive:**

- If marked `optional` and not applicable: delete the entire section (heading + body).
- If `remove-if <Key>=<Value>` applies to the current doc's field value: delete the section.
- Otherwise: fill the section body according to the body shape (table, list, etc.).
- Repeated groups: write one `###` per group, each heading matching the first H3's directive,
  each body a bullet list.

**`guide` blocks:**

- These are documentation only — author-facing prose. Delete them from the filled document.

### 3. Cross-reference checklist

Every identifier a prose or list section refers to must resolve against the section that
declares it: check each name in prose against the table or list that defines it, and each
rule of the opening `guide` block (the refine checks them, but fix them before you run it).

### 4. Validate

Run: `validate-md <filled-doc>` (or `validate-md --template <template-file> <filled-doc>` when no
catalog binds it).

Do not claim done until it prints `OK`. Use the **Validate** workflow below
to interpret any errors.

### 5. Final grep (mandatory)

`grep -n 'TEMPLATE-ONLY' <filled-doc>` must return nothing. This is not optional: validation
does not catch every leftover. A leftover `<!-- TEMPLATE-ONLY: string; optional -->` in an
optional field validates `OK` and is emitted as the literal value of the field; the same holds
for a plain list item. Leftover `guide` blocks are invisible when rendered but belong to the
template, not the document.

---

## D. Validating a document

### 1. Locate the template

1. In directory mode there is nothing to locate: `validate-md` binds each document to
   its template by the rule in `template-structure.guideline.md` (name and proximity).
   To see the binding, run `validate-md <file> --json`: each entry of `documents` names its
   `templatePath`; `--verbose` also lists the unbound files.
2. For a document outside any catalog, pass the template explicitly.
3. Check for a sibling `*.refine.ts` — its rules are enforced by the schema.

### 2. Always invoke the CLI

Never reimplement parsing inline. Lead with directory mode; it validates every bound
document under the paths, reports ambiguous and unbound files, and compiles each template
once:

```sh
validate-md <path>...                      # files or folders; --root <dir>, --ignore <dir-or-path>, --no-refine, --json, --verbose
validate-md --template <template-file> <doc-file>   # one document, for one that no catalog binds
```

The summary line (`12 documents: 11 OK, 1 failed; 1 ambiguous; 40 unbound`) ends the
output; the exit code is 0 only when everything bound validates and nothing is ambiguous.

### 3. Interpret the output

**`<file>: OK`** — the document passes all schema and refine checks.

**Structural error** — one line, `<file>: <message>`, no issue list. The document's shape is
wrong (a section, table or list is missing or extra); fix the structure, not the values:

```
example.md: Section "4. Inputs (Props)" must contain a table
```

**Schema issues** — `<file>: schema validation failed`, then one `  - <path>: <message>` line per
issue. The structure is right but values violate constraints:

```
example.md: schema validation failed
  - classification.Type: Invalid option: expected one of "Root"|"Layout"|"Container"|"View"|"Provider"|"Primitive"
  - visualStates.0.items: event "onToggle" is not declared in Outputs
```

**Template error** — `Error: invalid template <template-file>: <message>` (in directory mode the
template's documents are then reported as not validated). Fix the template, not the document.
Errors found while reading the directive text carry a position with a literal `template.md`
prefix, whatever the file is called; errors found later (an unknown kind or modifier) carry none:

```
Error: invalid template component.template.md: template.md:42:9: inline TEMPLATE-ONLY directive must close on the same line; "-->" not found before line end
Error: invalid template component.template.md: unknown TEMPLATE-ONLY directive kind: 'pik'
```

### 4. Triage by error message

| Message (after `<file>:` or `- <path>:`)                              | Cause                                                  | Fix                                                             |
| --------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------- |
| `Missing required section: "X"`                                       | Required H2 deleted or renamed                         | Restore the heading exactly as in the template                  |
| `Unrecognized section(s): "X"`                                        | Section not in the template, or heading text drifted   | Rename or remove it (or the template is meant `document; open`) |
| `Section "X" is out of order; …`                                      | Sections reordered                                     | Follow the template order (or `document; unordered`)            |
| `Duplicate section heading: "X"`                                      | The same H2 twice                                      | Merge them                                                      |
| `Section "X" must contain a table` / `… a list`                       | Body has the wrong shape (also `"X > H3"` for a group) | Write the table or list the template has                        |
| `Missing required summary: …`                                         | The `>` summary under the H1 is missing                | Add the blockquote                                              |
| `reference-style link (…) is not supported in a value cell; …`        | `[label][ref]` in a value                              | Use an inline link `[label](path)`                              |
| `title must match '…'`                                                | H1 prefix changed or value fails its directive         | Keep the H1 prefix; fix the value                               |
| `Invalid option: expected one of "A"\|"B"`                            | `enum:` field, column or H3 has another value          | Use exactly one listed choice                                   |
| `<Label> is required`                                                 | Required labeled-list field blank or removed           | Provide a value                                                 |
| `<Label> does not match required format`                              | Labeled-list field fails its `regex`                   | Fix the value format                                            |
| `Invalid string: must match pattern /…/`                              | Column, H3 heading or task item fails its `regex`      | Fix the value format                                            |
| `Too small: expected string to have >=1 characters`                   | Required table cell blank                              | Fill the cell                                                   |
| `Too small: expected array to have >=N items`                         | `min-rows`, `min-groups` or `min-items`                | Add rows, groups or items                                       |
| `Too big: expected array to have <=N items`                           | `max-rows`, `max-groups` or `max-items`                | Remove some                                                     |
| `Unrecognized key "X": not declared in the template`                  | Extra labeled-list key (or a guide splits the list)    | Remove it, or fix the template's guide placement                |
| `X is only allowed when Key=Value`                                    | `only-if` field present while the condition is false   | Remove the field                                                |
| `Section "X" must be removed when Key=Value`                          | `remove-if` holds                                      | Delete the section                                              |
| `Duplicate key "X": key values are unique across the document`        | A `key` value repeats                                  | Give each row its own ID                                        |
| `a checkbox cell must be '[ ]' or '[x]'`                              | Other text in a `checkbox` column                      | Write `[ ]` or `[x]`                                            |
| Any other message, e.g. `event "onToggle" is not declared in Outputs` | A rule of the sibling `*.refine.ts`                    | See the opening `guide` block and the refine                    |

### 5. Refine-rule diagnostics

When a message matches no row above, it's a refine violation:

1. Read the opening `<!-- TEMPLATE-ONLY: guide -->` block in the template for the prose rules.
2. Open the sibling `*.refine.ts` to find the corresponding `ctx.addIssue`.
3. The `path` in the issue points to the section that needs to change.

### 6. Common false alarms

- **Leftover `TEMPLATE-ONLY` blocks** — `grep -n 'TEMPLATE-ONLY' <doc>` shows
  directives not removed after filling. Delete them (some validate silently; see **C.5**).
- **Heading text drift** — edited a heading after filling; compare to template.
- **Curly quotes** — `“` or `”` from copy-paste where the template has a straight `"`. Replace them.
- **A choice that contains `|`** — the template writes it `\|`; the document writes a plain `|`.

### 7. Report shape

Group issues by section, map each to the directive it violates, and suggest
the minimal edit. Example:

> Section `classification` (line ~20):
>
> - `Type` must be one of `Root | Layout | Container | View | Provider | Primitive`.
>   Currently: `"view"` — note lowercase. Use `View`.

### What NOT to do

- Do not edit the template to silence a doc-level error.
- Do not disable or remove refine rules.
- Do not validate by reading the doc manually — always use the CLI.

---

## E. Organizing & locating templates

Full details in `template-structure.guideline.md`. Summary:

### Folder anatomy

```
<name>/
  <name>.template.md     # REQUIRED — stem must equal the folder name
  <name>.refine.ts       # OPTIONAL — sibling, same stem, named `refine` export (or a compiled .refine.js)
  examples/*.md          # OPTIONAL — filled instances, validated against the template
```

### Catalog and binding

The catalog is every `markdown-schema-templates/<name>/<name>.template.md`. A document named
`[<n>.][<artifact>.]<template>.md` binds to the closest template of that name: walk up from
its directory, looking in each ancestor's own templates folder; the first ancestor that has
one decides, so a closer template shadows a farther one of the same name. A name in capitals
falls back to lower case (`CHANGELOG.md` → `changelog`). A folder of relative symbolic links
(one per template) shares templates that live elsewhere. See `template-structure.guideline.md`.

### Refine & the filesystem

A refine is code and may read anything, but one that reads the file system cannot run in a
browser bundle. Prefer refines that read only `doc`; when one needs Node, say so in the
refine's header comment. `--no-refine` skips refines (structural and directive checks still
run).
