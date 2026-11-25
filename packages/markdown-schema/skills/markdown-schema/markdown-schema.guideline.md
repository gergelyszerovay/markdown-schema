# Markdown Template Authoring Guide

The reference for the `<!-- TEMPLATE-ONLY: -->` directive grammar of `markdown-schema`
templates. The workflows (deriving, authoring, filling and validating a template) and the
table of `validate-md` messages are in `SKILL.md`.

## How Templates Work

Templates use `<!-- TEMPLATE-ONLY: ... -->` HTML comments to carry both
machine-readable schema directives and author-facing prose. These comments
are invisible in rendered markdown until replaced with real content.

**Key principle:** Fixed structural scaffolding (headings, section titles, stable
labels like `Type:`, table headers) stays as plain markdown outside the comment
tags. Everything that changes per instance — placeholders, sample values,
schema constraints, and authoring guidance — goes inside `<!-- TEMPLATE-ONLY: -->`
blocks. Constants outside, variables inside.

**The "survives filling" test.** For every span of text in the template, ask:
_will this exact text still be present, character-for-character, in every
correctly filled instance?_ If yes, it's a constant — leave it outside. If no,
it's a variable — wrap it in `<!-- TEMPLATE-ONLY: -->`. Apply the test at the
finest granularity that still reads naturally: usually a label, a column
header, or a heading number, but never a whole line if only part of it varies.

**Common trap — enum placeholders.** A list of allowed values like
`Root | Layout | Container | View` _looks_ like fixed scaffolding because it
contains no `[brackets]`, but the author is meant to pick exactly one and
delete the rest. It fails the survives-filling test and therefore belongs
inside `<!-- TEMPLATE-ONLY: -->`. The same applies to any choice list, sample
value, or example identifier, even when no brackets are used.

**Anti-example:**

```markdown
<!-- WRONG — the enum is a placeholder, not a constant -->

- Type: Root | Layout | Container | View | Provider | Primitive

<!-- RIGHT — label outside, value inside -->

- Type: <!-- TEMPLATE-ONLY: enum: Root | Layout | Container | View | Provider | Primitive; required -->
```

## Schema Pairing Rule

The **template is the source of truth**. `validate-md` derives the schema from
the template's `<!-- TEMPLATE-ONLY: -->` directives at runtime — no separate
TypeScript schema file is needed. An optional `*.refine.ts` sibling adds
cross-section invariants that can't be expressed as directives:

```
component.template.md     ← source of truth; directives encode the schema
component.refine.ts       ← (optional) cross-section Zod refinements
```

To validate a filled document:

```sh
validate-md --template component.template.md example.md
```

## Two Kinds of Directives

Directives come in two structural shapes — **inline** and **block** — and the
distinction is not cosmetic; it's enforced by the parser.

### Inline directives

Sit _inside_ a heading, list item, or paragraph. They **must close on the same
line as the opener** (single-line). Multi-line bodies are a hard error.

```markdown
- Stage: <!-- TEMPLATE-ONLY: enum: Alpha | Beta | GA; required -->
- SKU: <!-- TEMPLATE-ONLY: string; regex `^[A-Z]{3}-\d{4}$`; required -->
```

The two inline kinds are `string` (with optional modifiers including `regex`)
and `enum:`. See _Directive Reference_ below.

### Block directives

Sit on their own line, opener at column ≤ 3 (CommonMark block-HTML rule),
closer (`-->`) on its own line. Bodies span multiple lines. Write body lines at
column 0: the parser trims their leading whitespace, so an indented column spec
is read the same, but the template reads better without it.

```markdown
<!-- TEMPLATE-ONLY: row; min-rows: 1
Prop Name: string; regex `^[a-z][a-zA-Z0-9]*$`; required
Type: string; required
Required: enum: Yes | No; required
-->
```

Modifiers on the **opener** line are semicolon-separated (same shape as inline
directives). The body holds whatever the directive kind allows: column specs
for `row`, `//` prose lines for `guide`, nothing for `section` or `freetext`.

The block kinds are `freetext`, `row`, `section`, `guide`, and `document`.

## Directive Reference

### `string` — inline scalar field

```markdown
- Parent Component: <!-- TEMPLATE-ONLY: string; required -->
- Source: <!-- TEMPLATE-ONLY: string; optional; only-if Type=Primitive -->
- SKU: <!-- TEMPLATE-ONLY: string; regex `^[A-Z]{3}-\d{4}$`; required -->
- Currency: <!-- TEMPLATE-ONLY: string; optional; default=USD -->
```

Modifiers (semicolon-separated):

- `required` / `optional` — presence constraint (default: required)
- `regex` — pattern written between backticks in the directive and compiled
  through the ReDoS guard, **not** a bare `new RegExp`. Your pattern may be
  **refused** if it is over-long (> 200 chars) or not close to linear-time;
  keep it simple and linear-ish. `regex` is a **modifier** of `string`, not a
  type of its own — a bare `regex` without a leading `string;` is a hard error,
  and missing backticks around the pattern is a hard error.
- `default=<value>` — fills `<value>` when the field is blank or absent; the
  default appears in the emitted JSON. A field with `default=` is implicitly
  optional (empty `default=` means "blank allowed"); combining `required` with
  `default=` is a hard error.
- `only-if <Key>=<Value>` — field is permitted only when the named sibling
  field equals the given value (enforced as a `superRefine` on the section).
  Fields are required by default, so write `string; optional; only-if Key=Value`:
  `required` (written or implied) with `only-if` is a hard error.

### `enum:` — inline choice list

```markdown
- Type: <!-- TEMPLATE-ONLY: enum: Root | Layout | Container | View | Provider | Primitive; required -->
- Tier: <!-- TEMPLATE-ONLY: enum: Free | Pro | Enterprise; optional -->
```

Choices are split on `|` and trimmed. The field schema becomes `z.enum([...])`.

**Escapes** — for choices containing `|` or `\`:

- `\|` → literal `|`
- `\\` → literal `\`
- Other `\x` → emitted as literal `\x` (lenient).

```markdown
- Logical Op: <!-- TEMPLATE-ONLY: enum: AND | OR | A \| B (either) | C \\ D; required -->
```

The third choice is the literal string `A | B (either)`; the fourth is
`C \ D`. Modifiers (`required`, `optional`) work the same as `string`.

### H1 placeholder

The H1 carries an inline directive that validates the document title:

```markdown
# Release Notes: <!-- TEMPLATE-ONLY: string; required -->

# Component Spec: <!-- TEMPLATE-ONLY: string; regex `^[A-Z][A-Za-z0-9]*$`; required -->
```

The title in the filled document is matched as `<prefix> <value>`, where
`prefix` is the literal H1 text up to the directive and `value` is validated
by the directive.

### Summary directive (blockquote under the H1)

A `>` blockquote between the H1 and the first `##` section whose text is an
inline field directive declares the document's summary:

```markdown
# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->
```

The filled document carries the summary as a `>` blockquote in the same
place. It is required or optional as written, checked against the regex, and
extracted as `summary` in the parse output; a wrapped blockquote is folded to
one line first. Only `string` directives are allowed here, and a template may
declare at most one summary. A template without the directive neither
enforces nor extracts a summary.

### H3 directive (in repeated sections)

Sections that contain repeated H3 sub-groups can validate each H3's heading
text. Place an inline directive inside the **first** H3 of the section:

```markdown
## Changes

<!-- TEMPLATE-ONLY: section; min-groups: 1 -->

### <!-- TEMPLATE-ONLY: string; regex `^(add|fix|chore): .+$`; required -->

- <!-- TEMPLATE-ONLY: string; required -->
```

After filling, an H3 reads e.g. `### add: loadPlugin()`. Only `string` and
`enum:` directives are allowed in H3s.

What a repeated section checks, and what it does not:

- **Only the first H3's directive counts**, and it applies to every group of the
  document. A directive on the second or a later H3 is ignored, and so is the
  text of a fixed H3 (`### 3.1 MUST`): a document's groups may have any heading
  unless the first H3 of the template constrains it.
- **Each group's body must be a bullet list**, and each group yields
  `{ heading, items: string[] }`. The items are not checked: labels, directives
  and fixed text in a group's list (`- Description: …`) only show the author what
  to write. A cross-group rule on them belongs in a refine.
- `section; min-groups: N` / `max-groups: N` bound the number of groups.

**H2 directives are not supported.** The H2 heading text is the JSON section
key (derived via `headingToKey`) — keys must be fixed.

### `row` — table row schema (block directive)

Placed between the header-separator row and the sample data row:

```markdown
| Prop Name | Type | Default | Required |
| --------- | ---- | ------- | -------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1; max-rows: 50
Prop Name: string; regex `^[a-z][a-zA-Z0-9]*$`; required
Type: string; required
Default: string; default=—
Required: enum: Yes | No; required
-->

| propName | string | — | Yes |
```

- **Opener modifiers**: `min-rows: N`, `max-rows: N`. Semicolon-separated.
- **`checkbox` type**: `Done: checkbox` declares a column whose cells are `[ ]` or
  `[x]`; the row object holds a boolean (`[X]` reads as checked, any other cell
  text is a validation issue, and the JSON Schema types the column `boolean`).
  `checkbox` takes no `key`, `optional`, `regex`, `enum:` or `default=`. Use it
  for keyed tables whose rows are worked through; use a task list for a plain
  checklist.
- **Body**: one column spec per line. Each spec is `Header: <field-modifiers>`,
  where field modifiers are the same grammar as inline `string` / `enum:`
  directives. Column header text matches the GFM table header literally
  (preserves spaces and casing). A header may be quoted (`"#": string; required`);
  the quotes are stripped. A header cannot contain a colon: the spec splits at
  the first one. Lines starting with `//` are skipped, so a `row` body can carry
  a short note; blank lines are skipped too.
- **`key` modifier**: `ID: string; key` marks the column whose values
  identify the rows, so a row can be cited as `<doc>#AC-1`. `key` implies `required`
  (`key; optional` and `key; default=` are template errors). Key values are unique across
  **every** key column of the document, so several tables share one ID namespace. The
  compiled template reports its key columns (`parseTemplate(...).keyColumns`) and
  `listRowKeys(data, keyColumns)` lists a parsed document's keys.

### `section` — section-level constraints (block directive)

Placed immediately under the section's H2. In most cases it fits on one line:

```markdown
## 7. Internal State

<!-- TEMPLATE-ONLY: section; optional; remove-if Type=View -->
```

Modifiers (opener-line, semicolon-separated):

- `optional` — the H2 may be absent in the filled doc; the section's JSON
  value is `undefined`. When the H2 **is** present, its body must still conform
  (a present-but-malformed optional section is a hard error, not `undefined`).
- `remove-if <Key>=<Value>` — the guarded section must be absent when the named
  labeled-list field equals the value. Present when it shouldn't be → hard
  error. The `<Key>` must be declared in exactly one labeled-list section
  (declared in zero or in several is a template error). Combine it with
  `optional` (`section; optional; remove-if Key=Value`); without it the section
  is required and the rule cannot be met — the template compiles, but no
  document with that value validates.
- `min-groups: N` / `max-groups: N` — for repeated sections (H3 sub-groups),
  enforces the count of groups. `N` must be a non-negative integer (garbage is
  a hard error, not a silent no-op).
- `min-items: N` / `max-items: N` / `regex \`...\`` — for task-list sections
(`- [ ]`/`- [x]` items): the number of items and a pattern each item's text
must match (`checked` is not constrained). On any other kind of section they
  are a template error.

### `freetext` — free-form markdown section (block directive)

Placed immediately under the section's H2 to opt the section into free-form
mode. The section's JSON value is the body serialized back to a markdown
string (all node types preserved: paragraphs, fenced code, lists, tables,
blockquotes, thematic breaks, H3+ headings).

```markdown
## 1. Summary

<!-- TEMPLATE-ONLY: freetext; required -->

A paragraph, a code block, a list — any markdown content.
```

Modifiers (opener-line, semicolon-separated):

- `required` — the section body must be non-empty (default).
- `optional` — the H2 may be absent; JSON value is `undefined`.

**Authoring rules for free-text sections:**

- Use H3+ for in-body structure; H2 always terminates the section.
- No `<!-- TEMPLATE-ONLY: -->` directives of any kind inside the body —
  including `guide` blocks. Place `guide` blocks _above_ the H2.
- Sections with no recognized shape and no `freetext` directive are a
  hard parse error.
- **Serialization normalizations:** the body is round-tripped through
  `mdast-util-to-markdown`. Bare URLs become autolink literals
  (`https://…` → `<https://…>`). Thematic breaks may be normalized to
  `***`. Treat the JSON value as a markdown string, not as the original
  source bytes.

### `document` — document-level options (block directive)

One directive, placed after the H1 and before the first H2, relaxes the two checks that make
a template strict by default:

```markdown
# Plan

<!-- TEMPLATE-ONLY: document; open; unordered -->
```

- `open`: a `##` section the template doesn't declare is accepted and parsed as free text
  (its body serialized like a `freetext` section, `###` sub-headings included). The parsed
  document gains `additionalSections`, a list of `{ key, heading, text }` in document order
  (the key derived from the heading as for declared sections); the field is absent when the
  document has no such section. Declared sections keep their own shape and requirements.
- `unordered`: the declared sections may appear in any order.

Use it for documents whose kind has a few fixed sections and a free remainder; leave it out
for anything that should stay uniform. A second `document` directive, or one inside a section,
is a template error.

### `guide` — author-facing prose (block directive)

Free-form prose, intended for the human filling the template. The parser
ignores it entirely — it has no schema effect. Body lines must start with
`//` (after optional leading whitespace) or be blank.

```markdown
<!-- TEMPLATE-ONLY: guide
// One concise sentence per bullet. Keep under 80 chars.
// If you need to call out a non-obvious constraint, do it here.
-->

- Highlights: <!-- TEMPLATE-ONLY: string; required -->
```

**Authoring convention:** place a `guide` block immediately _before_ the
list, table, sub-heading, or section it documents. A `guide` at the
top of a section documents the whole section; one at the top of the file
documents the whole template. Authors read top-to-bottom and expect explanation
before the thing being explained.

For a field in a labeled list, place the guide above the whole list, never
between items. A guide between two bullets splits the list in two: the template
keeps only the first part, so the next field is silently dropped from the
schema and a document that fills it fails with
`Unrecognized key "…": not declared in the template`.

A good `guide` answers at least one of:

- **What** is this field, in everyday words? (Not "string; required" but
  "the customer-facing name of the release.")
- **Why** does this constraint exist? (Not "regex `^v\d+\.\d+\.\d+$`" but
  "must match SemVer because our changelog tooling sorts by it.")
- **When** should this section/field appear, in the author's terms? (Not
  "only-if Type=Primitive" but "fill this only if you picked 'Primitive'
  in the Type field above.")
- **Example** of a good answer, when the format is unobvious.

Aim each `guide` at the author who will fill the template, not at a fellow
engineer reading the template's source.

**What to avoid:**

- **Restating the grammar.** `// string; required` adds no information.
- **Engineer-speak the author won't share.** "PascalCase identifier
  conforming to `[A-Z][A-Za-z0-9]*$`" → say "starts with a capital
  letter, e.g. `Card`."
- **Comments that go stale faster than the template.** Reference the
  _intent_ of a constraint, not the current implementation that enforces it.

## Section Extractor Inference

The parser infers the extractor from the section body's structure:

| Body shape                                  | Extractor    | Returns                                                                                                                                                 |
| ------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `freetext` directive present                | `freetext`   | `string` (markdown source, round-tripped)                                                                                                               |
| Sub-headings (H3 inside H2)                 | `repeated`   | `{ heading: string; items: string[] }[]`                                                                                                                |
| GFM table                                   | `table`      | `Record<string, string \| boolean>[]` (a `row` directive types the columns, `checkbox` ones as booleans; without one, rows get a permissive `z.record`) |
| Labeled bullet list (`- Key: value`)        | `bulletList` | extractor returns `string[]`; the labeled-list schema converts it to `Record<string, string \| undefined>`                                              |
| GFM task list (`- [ ]` / `- [x]`)           | `taskList`   | `{ checked: boolean; text: string }[]`                                                                                                                  |
| Plain unordered bullet list                 | `bulletList` | `string[]`                                                                                                                                              |
| None of the above (no `freetext` directive) | **error**    | "no recognized shape; add a `freetext` directive"                                                                                                       |

The H2 heading text becomes the JSON key (via `headingToKey`, e.g.
`## 1. Internal State` → `internalState`). The section's value is whatever
the inferred extractor produces. The whole parse output is the published
`DocumentData` type: `frontmatter`, `title`, `summary` (when the template
declares the summary directive), one `SectionValue` per declared section
under its key, and `additionalSections` for an `open` template. What every
directive declares is published as the template's `TemplateShape`
(`parseTemplate(...).shape`), and `templateJsonSchema(shape)` — or
`validate-md --template <t> --emit-schema` — turns it into a draft 2020-12
JSON Schema of that output (structure only: refines, `only-if`/`remove-if`
and key uniqueness are not represented).

**Cell text and links.** The value extractors — `table` body cells,
`bulletList`, and `taskList` — stringify each cell with `cellText` (exported
from the main entry point for code that writes custom extractors), which
matches `mdast-util-to-string` except that a Markdown `[label](url)` link
yields its **url**, not its label. So a path written as a real link
(`[4.foo.feature.md](../3.features/4.foo.feature.md)`) reaches a refine as the
bare path `../3.features/4.foo.feature.md` — it renders as a link while staying
checkable. Inline code and plain text yield their literal value (so a
backticked path is unchanged), and table **header** cells keep
`mdast-util-to-string` (header text is a label). A reference-style link
(`[label][ref]`) in a value cell is rejected — its target is unreachable from
the cell, so write inline links.

## Cross-Section Invariants (`*.refine.ts`)

Rules that span more than one section belong in a `*.refine.ts` sibling.
The CLI auto-discovers it; no directive is required to enable it.

```ts
// component.refine.ts
import type { z } from 'zod';

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;
  const declared = new Set(
    (d['outputs'] as Record<string, string>[]).map((row) => row['Event Name']),
  );
  (d['visualStates'] as { heading: string; items: string[] }[]).forEach((state, i) => {
    const visuals = state.items.find((item) => item.startsWith('Visuals:')) ?? '';
    for (const [, name] of visuals.matchAll(/\b(on[A-Z][a-zA-Z0-9]*)\b/g)) {
      if (!declared.has(name)) {
        ctx.addIssue({
          code: 'custom',
          path: ['visualStates', i, 'items'],
          message: `event "${name}" is not declared in Outputs`,
        });
      }
    }
  });
};
```

The CLI prints the issue as `- visualStates.0.items: event "onToggle" is not declared in Outputs`.
A rule a directive can express (`only-if`, `remove-if`) stays a directive; the
refine holds only what no directive can. Document each invariant in a `guide`
block under the H1 so authors filling the template know what cross-section
rules apply.

A refine is code and may read anything, but one that reads the file system cannot
run in a browser bundle: prefer refines that read only `doc`, and say in the
refine's header comment when one needs Node. `validate-md --no-refine` skips
refines.

## Generating a document

Two functions write a document instead of editing text by hand (both are on the
browser-safe `.` entry and take the template's shape, `parseTemplate(...).shape`):

- `generateDocument(shape, data, options?)` renders `DocumentData` — the form `parse`
  returns — to markdown: the frontmatter, the H1 title, the `>` summary, each
  declared section in template order, then the `additionalSections` of an `open`
  template. **The round-trip law:** for any `data` that validates against the
  template, `parse(generateDocument(shape, data))` deep-equals `data` and the text
  passes validation, so an agent that writes data against the template's JSON
  Schema (`--emit-schema`) writes a valid document by construction. The law runs
  one way: generating from a parsed document need not reproduce it byte for byte
  (a link cell reads as its URL, freetext is re-serialised, `[X]` reads as `[x]`).
  The data is validated first, and invalid data throws with each failure named by
  section and field (a checkbox must be `true` or `false`, not `"yes"`); pass
  `{ validate: false }` only when it was validated already.
- `generateSkeleton(shape)` writes the starting point from the shape alone: the
  headings in order, each table with its header row and one placeholder row (the
  column's `default=` where it has one, `<Column>` elsewhere, `[ ]` for a
  `checkbox` column), each labeled list with its keys as `- Label: <Label>`, and
  `<...>` placeholders for the title, the summary, freetext and list items. A
  skeleton need not validate (a placeholder may fail a regex). A repeated section
  gets one `### <...>` group with a `- <...>` item: the template's fixed H3
  headings and the bodies of its groups are not part of the shape, so they are
  not in the skeleton.

Tables are written unaligned (formatting is the formatter's job). Values are
escaped plain text, so a link in a generated cell is not supported; a `www.`
address or e-mail inside a value is written as inline code, because GFM would
otherwise read it back as a link. A value that cannot sit on one line (title,
summary, heading, table cell) throws.
