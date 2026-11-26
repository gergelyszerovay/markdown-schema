# markdown-schema

Validate Markdown documents against a template, and parse them into typed data.

## Example

A release note, written in plain Markdown, `release.md`:

```markdown
# Release: Widget 2.1

## Metadata

- Version: 2.1.0
- Stage: GA

## Highlights

- Dark mode for every page.
- Export to CSV.

## Fixes

| ID    | Description                     | Priority |
| ----- | ------------------------------- | -------- |
| FIX-1 | The date picker skips February. | High     |
| FIX-2 | Long names overflow the header. | Low      |
```

`validate-md` checks it against its template and turns it into this JSON:

```bash
npx validate-md --template release.template.md --emit-json release.json release.md
# release.md: OK
```

```json
{
  "title": "Release: Widget 2.1",
  "metadata": {
    "Version": "2.1.0",
    "Stage": "GA"
  },
  "highlights": ["Dark mode for every page.", "Export to CSV."],
  "fixes": [
    {
      "ID": "FIX-1",
      "Description": "The date picker skips February.",
      "Priority": "High"
    },
    {
      "ID": "FIX-2",
      "Description": "Long names overflow the header.",
      "Priority": "Low"
    }
  ]
}
```

The template, `release.template.md`, is the same document with a directive in place of each value. Everything
outside the `<!-- TEMPLATE-ONLY: -->` directives is structure every release note must keep:

```markdown
# Release: <!-- TEMPLATE-ONLY: string; required -->

## Metadata

- Version: <!-- TEMPLATE-ONLY: string; regex `^\d+\.\d+\.\d+$`; required -->
- Stage: <!-- TEMPLATE-ONLY: enum: Alpha | Beta | GA; required -->

## Highlights

- <!-- TEMPLATE-ONLY: string; required -->

## Fixes

| ID  | Description | Priority |
| --- | ----------- | -------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; regex `^FIX-\d+$`; required
Description: string; required
Priority: enum: Low | Medium | High; required
-->

| FIX-1 | Sample fix. | High |
```

A document that drifts from it fails with the reason, for example one without its fixes table:

```text
release.md: Missing required section: "Fixes"
```

## How it is used

A template describes one kind of document: its sections, its fields and their order. Every document of that kind
follows the template, `validate-md` reports any document that does not, and each valid document parses into typed
data that code can query, transform and render.

You rarely write a template by hand. The package ships an [agent skill](#agent-skill) that teaches a coding agent to
author, fill and validate templates, so a typical workflow is:

1. **Write a few documents** of the kind, or have an agent draft them, until their shape settles.
2. **Ask the agent to derive the template** from them. The skill tells it which directive fits each value, where a
   section is fixed or optional, and which rules belong in a `*.refine.ts` file.
3. **Have the agent fill the template** for each new document.
4. **Run `validate-md`** in your checks, so a document that drifts from its template fails, with the file, line
   and reason.
5. **Parse the documents in code** (`parseTemplate`) wherever you need their data.

## What `validate-md` checks

Templates are strict by default. A filled document fails when:

- a required section is missing, or a section the template does not declare appears (unless the template is
  `document; open`);
- the sections are in another order (unless the template is `document; unordered`);
- a list has a key the template does not declare, or lacks a required one;
- a table has an empty required cell, a value of the wrong type, or fewer rows than `min-rows`;
- two sections have the same heading;
- an optional section is present but its content does not match (optional means it may be absent).

A template fails too (`Error: invalid template <file>: …`) on an unknown directive or modifier, a malformed `regex`, a
contradictory combination (`required` with `only-if` or `default=`), colliding section keys, or an unsafe regex, so a
mistake in a template never weakens validation.

## Two ways to define a shape

- **Template mode** (most documents): a `*.template.md` with `<!-- TEMPLATE-ONLY: -->` directives, as in the
  example. `validate-md` and `parseTemplate` derive the schema from it.
- **Programmatic mode** (advanced): a schema written in TypeScript with `defineDocSchema`, for full static types,
  custom extractors or shapes the directives cannot express.

Both read a leading YAML [frontmatter](#frontmatter) block into `doc.frontmatter`.

## Install

```bash
npm i -D markdown-schema
# or
pnpm add -D markdown-schema
```

It needs Node.js 24 or later (see [Requirements](#requirements)).

The core API (`parseTemplate`, `defineDocSchema`, extractors) runs in the
**browser and Node**. Filesystem helpers (`loadRefine`) and the CLI are
Node-only — see [Entry points](#entry-points).

---

## Agent skill

The package ships an **agent skill**, `markdown-schema`, that teaches a coding agent the template workflows:

- **Deriving** a `*.template.md` from a few example documents: which sections are required or optional, which
  directive fits each value, and checking the result against the documents.
- **Authoring** or changing a template: choosing directives, splitting sections, and deciding what belongs in a
  `*.refine.ts` companion.
- **Filling** a template — replacing `<!-- TEMPLATE-ONLY: -->` directives with
  real content.
- **Validating** a document with `validate-md`, including how to read and triage
  its error output.

It encodes the directive grammar, a which-directive decision table, the
template-vs-`*.refine.ts` boundary, the traps the engine does not catch, and a triage table of
`validate-md`'s messages, so
the agent gets these workflows right without re-deriving the rules each time.

### Installing the skill

The skill ships in the npm package (exported as `./skills/*`). Two ways to copy it into a
project:

- With [`install-package-skills`](https://github.com/gergelyszerovay/install-package-skills): list the package
  in `devSkills` of the root `package.json` and run `install-package-skills`.

  ```json
  { "devSkills": ["markdown-schema"] }
  ```

- With the [`skills`](https://github.com/vercel-labs/skills) CLI, which copies the skill into
  your agent's skills directory and detects which agents you have:

  ```bash
  npx skills add gergelyszerovay/markdown-schema --skill markdown-schema      # this project
  npx skills add gergelyszerovay/markdown-schema --skill markdown-schema -g   # global
  ```

The skill source lives under
[`skills/markdown-schema/`](packages/markdown-schema/skills/markdown-schema/):

| File                              | Role                                                                    |
| --------------------------------- | ----------------------------------------------------------------------- |
| `SKILL.md`                        | Skill entry point — triggers, the workflows and the error table         |
| `markdown-schema.guideline.md`    | Reference for the `<!-- TEMPLATE-ONLY: -->` grammar                     |
| `template-structure.guideline.md` | Template folder anatomy, the catalog, and binding by name and proximity |

> Agents do **not** scan `node_modules`, so installing the npm package alone does
> not register the skill: use one of the two ways above, or copy the directory into
> `.claude/skills/` by hand.

Once installed, the agent triggers it automatically when you ask to author,
fill, or validate a `*.template.md`.

---

## Template mode

### Directives

A template is a document of its kind with `<!-- TEMPLATE-ONLY: ... -->` comments in place of the values.
Everything outside the comments is fixed structure that every filled document keeps. Directives come in two shapes:

- **Inline directives** sit inside a heading, list item or paragraph, and close on the same line.
- **Block directives** (a table's `row`, a `guide`) start on their own line at column 3 or less, close on their own
  line, and have their body lines at column 0.

A [`guide` block](#author-facing-prose-guide-blocks) holds instructions for the author, which the parser ignores.
The [directive reference](#directive-reference) lists every directive and modifier.

### Parse in code

The same template parses a document into the data of the [example](#example):

```ts
import { readFileSync } from 'node:fs';
import { parseTemplate } from 'markdown-schema';

const schema = parseTemplate(readFileSync('release.template.md', 'utf-8'));
const doc = schema.parse(readFileSync('release.md', 'utf-8'));
// doc.metadata   → { Version: "2.1.0", Stage: "GA" }
// doc.highlights → ["Dark mode for every page.", "Export to CSV."]
// doc.fixes      → [{ ID: "FIX-1", Description: "The date picker skips February.", Priority: "High" }, …]
```

`parseTemplate` runs in the browser and in Node. A document that does not match throws, with the reason.

### Cross-section invariants (`*.refine.ts`)

For rules that span multiple sections, add a sibling `*.refine.ts`:

```ts
// release.refine.ts
import type { z } from 'zod';

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;
  const meta = d['metadata'] as Record<string, string>;
  if (meta['Stage'] !== 'GA' && !d['knownIssues']) {
    ctx.addIssue({
      code: 'custom',
      path: ['knownIssues'],
      message: 'Non-GA releases must declare known issues',
    });
  }
};
```

Load it automatically at validation time:

```bash
validate-md --template release.template.md release.md
# refine.ts is loaded automatically when a sibling release.refine.ts exists
```

Or load it manually in code:

```ts
import { parseTemplate } from 'markdown-schema';
// loadRefine reads the filesystem, so it ships on the node-only subpath.
import { loadRefine } from 'markdown-schema/node';

const refine = await loadRefine('release.template.md');
const schema = parseTemplate(templateRaw, { refine });
```

### Frontmatter

A document may begin with a YAML frontmatter block — a `---`-fenced region at
the very top of the file. When present, it is parsed and exposed on the result
as `doc.frontmatter`. When absent, `doc.frontmatter` is `undefined`; an empty
block (`---\n---`) yields `{}`.

```markdown
---
name: Heritage
colors:
  primary: '#1A1C1E'
  neutral: '#F7F5F2'
---

# Heritage

## 1. Summary

Body.
```

```ts
const doc = schema.parse(raw);
// doc.frontmatter → { name: "Heritage", colors: { primary: "#1A1C1E", neutral: "#F7F5F2" } }
```

The frontmatter is parsed and **exposed** — it is not validated against any
declarative schema. There is no template grammar for describing frontmatter
keys; the YAML region of a `*.template.md` is ignored for schema inference.
Validate frontmatter in a `*.refine.ts` sibling, which receives the whole
document including `doc.frontmatter`:

```ts
// design.refine.ts
import type { z } from 'zod';

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const fm = (doc as { frontmatter?: { colors?: Record<string, string> } }).frontmatter;
  if (!fm?.colors?.['primary']) {
    ctx.addIssue({
      code: 'custom',
      path: ['frontmatter', 'colors', 'primary'],
      message: 'primary color is required',
    });
  }
};
```

`doc.frontmatter` is typed as `unknown` (its shape is document-specific); narrow
it inside the refine function. The parsed frontmatter also flows through
`--emit-json`, so it appears in the emitted document object.

> **Why no declarative frontmatter grammar?** Frontmatter shapes vary widely
> (nested maps, arrays, domain-specific types). Rather than grow the directive
> grammar, the parser extracts the YAML and hands it to `*.refine.ts`, where
> arbitrary Zod/TypeScript rules can validate it with full flexibility.

### Directive reference

All directives live inside `<!-- TEMPLATE-ONLY: ... -->` blocks. The first
non-whitespace token is the directive kind. Unknown directive **kinds** and
unknown **modifiers** are both hard errors — a typo can't silently weaken a
constraint.

**Inline directives** (must close on the same line as the opener):

| Directive                             | Schema produced                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `string; required`                    | `z.string().min(1)`                                                                                                            |
| `string; optional`                    | `z.string().optional()`                                                                                                        |
| `string; regex \`^…$\`; required`     | `z.string().regex(…)`                                                                                                          |
| `string; default=<value>`             | fills `<value>` when blank; implies optional (empty `default=` = "blank allowed"; `required` + `default=` is a template error) |
| `string; optional; only-if Key=Value` | field present only when sibling equals value; `required` + `only-if` is a template error                                       |
| `enum: A \| B \| C; required`         | `z.enum(["A", "B", "C"])`                                                                                                      |
| `enum: A \\\| B \| C; required`       | choice `"A \| B"`, choice `"C"` (`\\\|` escape)                                                                                |

`regex` is a modifier of `string`, not a type of its own. A bare `regex` without a leading `string;` is a hard error.

**Block directives** (own-line opener at column ≤ 3; body lines at column 0):

| Directive                                              | Effect                                                                                                                                                                                         |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `freetext; required` / `freetext; optional`            | section body is free-form markdown (see below)                                                                                                                                                 |
| `row; min-rows: N; max-rows: N` + body of column specs | `z.array(z.object({…}))` — one entry per row; a column declared `string; key` is required and identifies its rows (values unique across the document; `key` + `optional` is a template error)  |
| `section; optional`                                    | whole section heading may be absent (present ⇒ body must still conform)                                                                                                                        |
| `section; optional; remove-if Key=Value`               | guarded section must be absent when the referenced labeled-list field equals `Value` (the key must be declared in exactly one labeled-list section); without `optional` the rule cannot be met |
| `section; min-groups: N` / `max-groups: N`             | for repeated sections, constrain the count of groups                                                                                                                                           |
| `section; min-items: N; max-items: N; regex \`…\``     | for task-list sections (`- [ ]` / `- [x]`), constrain the count of items and the pattern each item's text must match; on any other section kind it is a template error                         |
| `guide` + body of `//` lines                           | author-facing prose; ignored by parser                                                                                                                                                         |
| `document; open; unordered`                            | after the H1: `open` accepts undeclared `##` sections (free text, in `additionalSections`); `unordered` accepts the declared sections in any order (see below)                                 |

**`row` column specs** use the same grammar as inline `string` / `enum:`
directives — one column per body line, e.g.:

```markdown
<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; regex `^AC-\d+$`; required
Description: string; required
Priority: enum: Low | Medium | High; required
-->
```

A column declared `Done: checkbox` holds `[ ]` or `[x]` (`[X]` reads as checked) and the
row object carries a boolean; any other cell text is a validation issue, and the JSON Schema
types the column `boolean`. `checkbox` takes no `key`, `optional`, `regex`, `enum:` or
`default=`. Use a task list for a plain checklist and a checkbox column for a keyed table
whose rows are worked through.

Required columns reject empty cells; `default=` fills a blank cell before
validation. `min-rows` / `max-rows` (and `min-groups` / `max-groups` on
`section`) must be non-negative integers — anything else is a template error.

### Document-level options: `document`

Templates are strict by default. One `document` directive between the H1 and the first H2
relaxes that:

```markdown
# Plan

<!-- TEMPLATE-ONLY: document; open; unordered -->
```

- `open`: an undeclared `##` section is accepted and parsed as free text. The parsed
  document gains `additionalSections`, a list of `{ key, heading, text }` in document order
  (absent when there is none). Declared sections are validated as usual, and a required one
  must still be present.
- `unordered`: the declared sections may appear in any order.

A second `document` directive, or one inside a section, is a template error.

### The summary directive

A `>` blockquote between the H1 and the first `##` section whose text is an inline field
directive declares the document's summary:

```markdown
# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->
```

A filled document carries its summary as a `>` blockquote in the same place. The summary is
required or optional as the directive says, checked against its regex, and extracted as
`summary` in the parse output; a blockquote wrapped over several lines is folded to one line
first. Only `string` directives are allowed here, and a template may declare at most one
summary. A template without the directive neither enforces nor extracts a summary — a
blockquote in the preamble is then ignored.

### Author-facing prose: `guide` blocks

Long-form authoring guidance lives in standalone `guide` block directives.
Body lines must start with `//` (after optional whitespace) or be blank.

```markdown
<!-- TEMPLATE-ONLY: guide
// Choose the release stage. GA means the feature is production-ready and
// has shipped to all customers; Beta means a stable preview; Alpha means
// early access for design partners.
-->

- Stage: <!-- TEMPLATE-ONLY: enum: Alpha | Beta | GA; required -->
```

**Convention:** place a `guide` block immediately _before_ the field, list,
table, sub-heading, or section it documents. A `guide` at the top of a
section documents the whole section; one at the top of the file documents
the whole template. The parser doesn't enforce placement, but authors read
top-to-bottom and expect explanation before the thing being explained.

A `guide` answers at least one of: _what_ this field is in everyday words,
_why_ a constraint exists, _when_ a section/field applies, or shows an
_example_ of a good answer. Avoid restating the grammar
(`// string; required` adds no information) and avoid engineer-speak the
filling author won't share.

### Free-text sections

When a section contains a mix of prose, code, lists, blockquotes, or other
arbitrary markdown that doesn't fit a fixed schema shape, opt it into
**free-text mode** by placing a `freetext` block directive under the H2:

````markdown
## 1. Summary

<!-- TEMPLATE-ONLY: freetext; required -->

A paragraph.

```ts
const example = true;
```

- A bullet point.
````

The section's JSON value will be the body serialized back to a markdown
string via `mdast-util-to-markdown` (with GFM extensions). All node types
are preserved: paragraphs, fenced code, lists, tables, blockquotes, thematic
breaks, H3+ headings.

**Authoring rules:**

- Use H3+ for structure inside a free-text body; H2 always ends the section.
- No `<!-- TEMPLATE-ONLY: -->` directives of any kind inside the body —
  including `guide` blocks. Place `guide` blocks _above_ the H2 instead.
- Sections with no recognized shape and no `freetext` directive are a hard
  error; the parser will not silently accept them.
- **Serialization normalizations:** `mdast-util-to-markdown` normalizes some
  constructs on round-trip. Bare URLs become autolink literals (`https://…`
  → `<https://…>`). Thematic breaks may be normalized to `***`. Downstream
  consumers should treat the value as a markdown string, not as the exact
  source bytes.

### Heading-level directive support

| Heading level    | Inline directive supported?                                               |
| ---------------- | ------------------------------------------------------------------------- |
| H1               | **Yes** — validates the document title (typed `string` / `enum:`)         |
| `>` under the H1 | **Yes** — the [summary directive](#the-summary-directive) (`string` only) |
| H2               | **No** — H2 text is the JSON section key; keys must be fixed              |
| H3               | **Yes, in repeated sections** — validates each per-group heading text     |

### Section extractor inference

The parser picks an extractor automatically from the section body shape:

| Body shape                                  | Extractor    | Returns                                                                                                                                                                                       |
| ------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `freetext` directive present                | `freetext`   | `string` (markdown source, round-tripped)                                                                                                                                                     |
| Sub-headings (H3 inside H2)                 | `repeated`   | `{ heading: string; items: string[] }[]`                                                                                                                                                      |
| GFM table                                   | `table`      | `Record<string, string \| boolean>[]` (with a `row` directive the columns are typed, `checkbox` ones as booleans; without one, each row gets a permissive `z.record(z.string(), z.string())`) |
| Labeled bullet list (`- Key: value`)        | `bulletList` | extractor returns `string[]`; the labeled-list schema transforms it to `Record<string, string \| undefined>`                                                                                  |
| GFM task list (`- [ ]` / `- [x]`)           | `taskList`   | `{ checked: boolean; text: string }[]`                                                                                                                                                        |
| Plain unordered bullet list                 | `bulletList` | `string[]`                                                                                                                                                                                    |
| None of the above (no `freetext` directive) | **error**    | "no recognized shape; add a `freetext` directive"                                                                                                                                             |

**Cell text and links.** The value extractors — `table` body cells,
`bulletList`, and `taskList` — stringify each cell with `cellText` (exported
from the main entry point for programmatic consumers writing custom extractors),
which matches `mdast-util-to-string` except that a Markdown `[label](url)` link
yields its **url**, not its label. So a path citation written as a real link
(`[4.foo.feature.md](../3.features/4.foo.feature.md)`) reaches a refine as the
bare path `../3.features/4.foo.feature.md` — it renders as a native link while
staying validatable. Inline code and plain text still yield their literal value
(so a backticked path is unchanged), and table **header** cells keep
`mdast-util-to-string` (header text is a label, never a citation). A
reference-style link (`[label][ref]`) in a value cell is rejected — its target
is unreachable, so citations must use inline links.

---

## Programmatic mode (advanced)

> Most documents are better served by [template mode](#template-mode) — the
> schema lives next to the prose and the CLI validates it. Reach for
> programmatic mode only when you need what's below.

Use `defineDocSchema` when you need full TypeScript types or extractors not
covered by template directives.

### Example

A complete, runnable example lives in
[`examples/programmatic/`](packages/markdown-schema/examples/programmatic/) — a release-notes schema that
exercises **every** extractor and `defineDocSchema` option:

| File                                                                                        | Role                                                           |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [`release-schema.ts`](packages/markdown-schema/examples/programmatic/release-schema.ts)     | The `defineDocSchema` schema (title, all extractors, `refine`) |
| [`release.md`](packages/markdown-schema/examples/programmatic/release.md)                   | A filled document that validates against it                    |
| [`run.ts`](packages/markdown-schema/examples/programmatic/run.ts)                           | Parses `release.md` and prints the typed JSON                  |
| [`output/release.json`](packages/markdown-schema/examples/programmatic/output/release.json) | The emitted, validated structured payload                      |

The example lives in the repository (it is not part of the npm package). From
`packages/markdown-schema/`:

```bash
pnpm install && pnpm build   # build first — release-schema.ts imports the built dist/index.mjs
node examples/programmatic/run.ts
```

Two sections in that example are worth calling out, because they show the
repeating-group extractors that template directives cannot express:

- **`changes`** uses [`repeated`](#extractors) — splits the section by `H3`
  sub-heading and runs a sub-extractor map (`freetext` + `optional(table)` +
  `codeBlocks`) on each group.
- **`migration`** uses [`repeatedWhere`](#extractors) — splits by an arbitrary
  node predicate (here, `thematicBreak` / `---` rules) rather than headings.

Its `refine` then ties the two together as a cross-section invariant (pending
checklist items require migration steps).

<details>
<summary>Skeleton of the schema (see the file for the full version)</summary>

```ts
import { z } from 'zod';
import {
  defineDocSchema,
  freetext,
  table,
  codeBlocks,
  optional,
  repeated,
  repeatedWhere,
} from 'markdown-schema';

export const ReleaseDoc = defineDocSchema({
  title: { schema: z.string().regex(/^v\d+\.\d+\.\d+$/, 'must be semver') },
  sections: {
    summary: {
      heading: 'Summary',
      extract: freetext,
      schema: z.string().min(10),
    },
    // …
    changes: {
      heading: 'Changes',
      extract: repeated({
        shape: {
          description: freetext,
          params: optional(table),
          snippets: codeBlocks,
        },
      }),
      schema: z.array(/* Change */ z.object({})).min(1),
    },
    migration: {
      heading: 'Migration',
      extract: repeatedWhere({
        startsAt: (n) => n.type === 'thematicBreak',
        shape: { body: freetext },
      }),
      schema: z.array(z.object({ heading: z.string(), body: z.string().min(1) })),
      optional: true,
    },
  },
  refine: (doc, ctx) => {
    /* pending checklist items require migration steps — see the file */
  },
});
```

</details>

`validate-md` works with templates only; a programmatic schema is used in code, with `.parse(raw)` as above.

---

## Entry points

The package has two entry points so the core API can bundle for the browser:

| Import path            | Environment    | Exports                                                                                                                                                                                                                                                                                                          |
| ---------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `markdown-schema`      | browser + node | `parseTemplate`, `defineDocSchema`, all extractors, `headingToKey`, `listRowKeys`, `templateJsonSchema`, the shape and data types (`TemplateShape`, `DocumentData`, `SectionValue`, …), `type RefineFunction`, and the [binding conventions](#binding-conventions) — pure mdast/zod/path rules, no node builtins |
| `markdown-schema/node` | node only      | `loadRefine` — reads the filesystem and dynamically imports `*.refine.ts`                                                                                                                                                                                                                                        |

The `validate-md` CLI is node-only and uses the `/node` entry internally.

---

## API surface

### Template mode

| Export                                    | Entry   | Description                                                                                                                                                                                                       |
| ----------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parseTemplate(raw, opts?)`               | `.`     | Parses a `*.template.md` string into a `{ parse(raw, { tree }?), keyColumns, shape }` object; `tree` is the document's already-parsed mdast tree (remark, GFM, YAML frontmatter), so the text is not parsed again |
| `parseTemplateAsync(raw, opts?)`          | `.`     | Like `parseTemplate`, but checks the template's regex patterns together with `recheck`'s asynchronous check instead of blocking once per pattern; resolves to the same schema object                              |
| `generateDocument(shape, data, options?)` | `.`     | Renders `DocumentData` to markdown from a template's `shape`, validating the data first (see [Generating documents](#generating-documents))                                                                       |
| `generateSkeleton(shape)`                 | `.`     | Writes a skeleton document from a template's `shape` alone: headings, table header rows with a placeholder row, labeled-list keys and `<...>` placeholders                                                        |
| `templateJsonSchema(shape, identity?)`    | `.`     | Walks a template's `shape` into one draft 2020-12 JSON Schema of the `DocumentData` its `parse` emits (see [the template shape](#the-template-shape-and-json-schema))                                             |
| `headingToKey(heading)`                   | `.`     | Converts H2 text (e.g. `"1. Summary"`) to a camelCase key (`"summary"`)                                                                                                                                           |
| `loadRefine(templatePath)`                | `/node` | Dynamically loads the sibling `*.refine.ts`; returns `undefined` if absent                                                                                                                                        |

### The template shape and JSON Schema

`parseTemplate` compiles in two steps: it first infers the template's **shape** — everything
the directives declare, as plain data — and then compiles the zod schema and extractors from
it, so the shape is the single source of truth for what the template requires. The shape is
published on the compiled template:

```ts
const template = parseTemplate(raw);
template.shape; // TemplateShape
```

| Type               | What it holds                                                                                                                                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `TemplateShape`    | `open`/`unordered`, the `title` (its pattern and the parts it was composed from: prefix, directive kind, choices), the `summary` field when declared, and one `SectionShape` per `##` section                                                                                                                |
| `SectionShape`     | the section's `key` (via `headingToKey`), `heading`, `optional`, `removeIf`, and a kind-discriminated `body`                                                                                                                                                                                                 |
| `SectionBodyShape` | `freetext`, `table` (with `ColumnShape[]` — every table carries its header row's columns, `declared` says whether a `row` directive set their rules — and `minRows`/`maxRows`), `labeled-list` (with `FieldShape[]`), `task-list` (with `minItems`/`maxItems`/`pattern`), `plain-list`, or `repeated-groups` |
| `DocumentData`     | the parse output: `frontmatter`, `title`, `summary`, one `SectionValue` per declared section under its key, `additionalSections` for an open template                                                                                                                                                        |
| `SectionValue`     | what each section kind extracts: a markdown string, row records, a labeled record, task items, plain strings, or `{ heading, items }` groups                                                                                                                                                                 |

`templateJsonSchema(shape)` walks the shape into one draft 2020-12 JSON Schema describing
that `DocumentData`, and `validate-md --template <t> --emit-schema` prints it. The schema
documents the **structural contract only**: refine companions are code and are not
represented, and neither are the conditional rules (`only-if`, `remove-if`) or the
cross-document uniqueness of `key` columns — those hold on top of the structure. For every
template, the generated schema accepts the `--emit-json` output of its valid documents.

The schema says what it describes: each section carries a `description` from its heading,
and `templateJsonSchema(shape, { name })` (what `--emit-schema` calls, with the template's
file name read as its name) adds the root's `title`, `description` and
`$id` (`urn:markdown-schema:template:<name>`), so a model handed the schema knows which
document it is filling.

### Generating documents

`generateDocument(shape, data)` writes a document from the data `parse` returns: the
frontmatter, the H1 title, the `>` summary, each declared section in template order, then
the `additionalSections` of an `open` template. A section absent from the data is left out.

**The round-trip law:** for any `data` that validates against a template,
`parse(generateDocument(shape, data))` deep-equals `data`, and the generated text passes
validation. An agent that writes data against the template's JSON Schema therefore writes a
valid document by construction. `generateDocument` checks the precondition: it validates
`data` against the shape first (the JSON Schema's structural contract, plus `only-if`,
`remove-if` and unique `key` values) and throws, listing every failure with its section and
field, before writing anything, so `{ "Done": "true" }` is refused rather than written as an
unchecked box. Pass `{ validate: false }` when the data was validated already. A refine
companion is code and is not run. The law runs one way: `generateDocument(shape, parse(doc))`
need not reproduce `doc` byte for byte, because the parse side normalises (a link cell reads
as its URL, freetext is re-serialised, `[X]` reads as `[x]`, a row's cells are trimmed).

```ts
import { generateDocument, generateSkeleton, parseTemplate } from 'markdown-schema';

const { shape, parse } = parseTemplate(templateText);
const text = generateDocument(shape, data); // data in the form parse returns; invalid data throws
generateDocument(shape, data, { validate: false }); // already validated: skip the check
parse(text); // deep-equals data
generateSkeleton(shape); // a starting point with <...> placeholders; need not validate
```

- Tables are written unaligned, plain GFM; alignment is the formatter's job.
- Values are written as escaped plain text, so a value that looks like markdown stays
  literal text. **Links in generated cells are not supported:** `parse` reads a link as its
  URL, so a link written into a cell would not round-trip. A `www.` address or e-mail address inside a
  value is written as inline code, because GFM would otherwise read it back as a link.
- A value that cannot sit on one line (the title, the summary, a heading, a table cell)
  throws; a list item may carry soft line breaks.
- A trailing table cell absent from the data is left out of the row, so a row with fewer
  cells than headers round-trips; an absent cell followed by a present one is written empty
  and parses back as an empty string.
- Generation is API-only; there is no CLI command.

**`parseTemplate` options (`opts`):**

| Option            | Default | Description                                                                                                                                      |
| ----------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `refine`          | —       | Cross-section refinement callback to attach (usually `loadRefine`'s result)                                                                      |
| `file`            | —       | Source file path used in error messages                                                                                                          |
| `orderedSections` | `true`  | Enforce that document sections appear in the template's order; set `false` to allow any order (a template declared `unordered` always allows it) |

### Extractors

| Extractor                                        | Returns                                                                                                                     |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `freetext`                                       | Section body serialized back to markdown (all node types preserved)                                                         |
| `table`                                          | First GFM table as `Record<string, string>[]`; throws if absent                                                             |
| `bulletList`                                     | List items as `string[]` (the labeled-list schema, not the extractor, converts to `Record<string, string \| undefined>`)    |
| `taskList`                                       | GFM task list as `{ checked: boolean; text: string }[]`; throws if absent                                                   |
| `cellText`                                       | Link-aware node stringification used by the value extractors; a Markdown link yields its url, a reference-style link throws |
| `codeBlocks`                                     | All fenced code blocks as `{ lang: string \| null; value: string }[]`                                                       |
| `rawNodes`                                       | The raw `RootContent[]` unchanged                                                                                           |
| `fencedCodeWithMarker({ marker, markerLabel? })` | Code block following an HTML comment matching `marker`                                                                      |
| `optional(ex)`                                   | Wraps any extractor; returns `undefined` instead of throwing                                                                |
| `repeated({ by?, shape })`                       | Splits by sub-heading; auto-detects depth                                                                                   |
| `repeatedWhere({ startsAt, shape, … })`          | Generic repeating groups driven by a node predicate                                                                         |

### Doc schema builder

| Export                  | Description                                                                       |
| ----------------------- | --------------------------------------------------------------------------------- |
| `defineDocSchema(spec)` | Returns `{ parse(raw: string): DocOf<S> }`                                        |
| `SectionSpec<S>`        | Type for one section entry                                                        |
| `DocOf<S>`              | Infers the fully-typed parse result from a spec; includes `frontmatter?: unknown` |

**`defineDocSchema` spec fields:**

| Field          | Default  | Description                                                                                    |
| -------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `title`        | —        | `{ schema }` — extracts the H1 as the document title                                           |
| `summary`      | —        | `{ schema, required }` — extracts the `>` blockquote under the title as the document's summary |
| `titleDepth`   | `1`      | Heading depth for the title                                                                    |
| `sectionDepth` | `2`      | Heading depth used as section boundaries                                                       |
| `sections`     | required | Map of output key → `SectionSpec`                                                              |
| `refine`       | —        | `(doc, ctx) => void` — cross-section Zod refinement                                            |

**`SectionSpec` fields:**

| Field      | Default     | Description                                       |
| ---------- | ----------- | ------------------------------------------------- |
| `heading`  | section key | Heading text in the document                      |
| `extract`  | required    | Extractor called on the section's body nodes      |
| `schema`   | required    | Zod schema that validates the extracted value     |
| `optional` | `false`     | When `true`, a missing section yields `undefined` |

---

## CLI

`validate-md` has two modes. With `--template` it validates the given files against one
template; without it, it validates a whole tree ([directory mode](#directory-mode)).

### Single-template mode

```bash
# Validate one or more documents against a template
validate-md --template component.template.md component.md
validate-md --template component.template.md *.md

# Validate and emit the parsed document as JSON (exactly one input file)
validate-md --template component.template.md --emit-json component.json component.md

# Print the template's JSON Schema (draft 2020-12) to stdout
validate-md --template component.template.md --emit-schema
```

- `--template <file.template.md>` — required; the template that drives the schema.
- `--emit-json <path>` — write the parsed document (sections, title, summary, and
  `frontmatter`) to `<path>` as JSON. Requires exactly one input file.
- `--emit-schema` — print the template's JSON Schema (see
  [the template shape](#the-template-shape-and-json-schema)) to stdout and exit; takes no
  input files and no other flag. The template's `*.refine.ts` is never loaded in this mode.
- `--no-refine` — skip loading the sibling `*.refine.ts`. Use when validating
  **untrusted** templates (see [Security](#security)).

A sibling `*.refine.ts` next to the template is loaded automatically (unless
`--no-refine` is given). Unknown `--flags` and flags missing their value are
usage errors — they are never silently treated as input files.

Prints `<file>: OK` on success — or `<file>: OK (wrote <path>)` when
`--emit-json` is set. Failures come in two shapes: **structural** errors print
as a single line (e.g. `component.md: Section "4. Inputs (Props)" must contain a
table`), while constraint violations print `<file>: schema validation failed`
followed by one `path: message` line per Zod issue. Exits `1` if any file
fails, `0` otherwise.

All status lines are written to **stderr**, so `--emit-json /dev/stdout` yields
clean JSON on stdout (pipeable to `jq`).

### Directory mode

```bash
validate-md                       # (no arguments) prints the usage; `validate-md .` validates the tree
validate-md docs skills/x/SKILL.md
validate-md docs --root . --ignore vendor --ignore generated/out --json
```

`validate-md [<path>...] [--root <dir>] [--ignore <dir-or-path>]... [--no-refine] [--json]
[--verbose]` lists what the paths can bind to once, builds the template catalog from it, binds
every Markdown file listed to its template ([see below](#binding-conventions)), compiles each
template once, and validates each bound document against its template.

- **Root and paths.** `--root` defaults to the nearest ancestor holding `.git` (a directory or
  a file, so worktrees count), else the current directory. Documents are validated under the
  given paths (default `.`), which must lie inside the root: a document can bind to a template
  outside the paths being checked.
- **What is read.** Only the given paths (a file itself, a folder walked) and the templates
  folder of each of their ancestors, up to the root, with the directory each template link
  points to. That is everything a binding can depend on, so a run costs what the paths cost,
  not what the repository costs. When a path is the root and the root is a Git work tree, the
  files come from `git ls-files --cached --others --exclude-standard`, so ignored folders
  (build output, agent worktrees) are never visited; outside Git the root is walked from disk.
- **Skipped.** `.git`, `node_modules`, `dist`, and whatever `--ignore` names: a directory name (matched
  anywhere) or a path relative to the root. Symbolic links are never followed (a template link's
  target directory is read, when nothing on the way to it is a link). A run on the root of a Git
  work tree (`validate-md .`, `.git` in the root) also skips what Git ignores, nested
  repositories and submodules; a run on a folder walks the disk and does not.
- **Validated.** Every bound document. A template that does not compile is reported once and
  its documents are reported as not validated. Files in a template's own `examples/` folder
  are validated against that template. Sibling `*.refine.ts` files are loaded unless
  `--no-refine` is given.
- **Output.** One line per bound document (`path: OK`, or the failure as in single-template
  mode), ambiguous files with their candidates, template errors, and a summary such as
  `12 documents: 11 OK, 1 failed; 1 ambiguous; 40 unbound`. A template link that stands for no template (its
  target lacks `<name>.template.md`, or the way there crosses a symbolic link or a skipped folder)
  is printed as a `Warning: template link ...` line and listed in `--json`'s
  `unreadTemplateLinks`; it does not change the exit code. `--verbose` also lists the unbound
  files. `--json` prints the whole result to stdout instead. Paths are relative to the root.
- **Exit code.** `0` when everything bound validates and nothing is ambiguous; `1` for a
  failed document, an ambiguous file, a template that does not compile, or a root or path
  that is refused.

### Binding conventions

Directory mode binds a document to a template by file name and tree proximity. They are pure
rules over a path list, exported from the `.` entry (`listTemplates`, `bindDocuments`, `listFilePaths`,
`templateNameOf`, `templateFolderName`, `templateFolderNames`);
the engine (`parseTemplate` and the rest) never uses them.

- **Catalog.** A template is `markdown-schema-templates/<name>/<name>.template.md` anywhere
  in the tree, or a link in a templates folder (see **Links**). A templates folder that is itself a
  symbolic link is not read.
- **Name.** A file `[<n>.][<artifact>.]<name>.md` asks for the template `<name>`: the last
  segment of its name after an optional level number (`2.billing.constitution.md` asks for
  `constitution`, `plan.md` for `plan`). A name in capitals (`CHANGELOG.md`, `README.md`) asks for
  the template of that name and, when no template has it, for the lower-case one: `CHANGELOG.md`
  binds to `changelog`.
- **Proximity.** Walking up from the document's directory, the first ancestor whose own
  `markdown-schema-templates/` folder holds a template of that name decides; its subtree is not
  searched.
- **Links.** A symbolic link `<templates folder>/<name>` to a directory that holds
  `<name>.template.md` counts as that template (`listFilePaths` turns a listing into the file
  list); a folder of relative links shares templates that live elsewhere. The template is read
  through the link. Other symbolic links are never followed.
- A file inside a templates folder is never bound, except its template's `examples/`.

### Requirements

- **Node.js ≥ 24**. The CLI loads the sibling `*.refine.ts` with Node's
  built-in [type stripping](https://nodejs.org/api/typescript.html#type-stripping)
  (on by default). No `tsx`, `ts-node`, or build step
  needed.
- TypeScript syntax that erases to plain JavaScript works as-is (`type`,
  `interface`, type annotations, `as`, `satisfies`). Runtime-emitting syntax
  (`enum`, `namespace`, parameter properties, legacy decorators) must be
  compiled first.

---

## Security

This library builds schemas from `*.template.md` files and validates documents
against them. If **either** the template or the document can come from an
untrusted source (a PR, an upload, a third party), read this.

### Executing `*.refine.ts` (code execution)

Loading a template auto-imports its sibling `<stem>.refine.ts` and runs its
`refine` export. **Validating an untrusted template therefore executes
arbitrary code** shipped beside it. The path is confined to the sibling file (no
traversal), but the feature is code-execution by design.

- CLI: pass `--no-refine` to skip it.
- Programmatic: simply don't call `loadRefine` / don't pass `refine` to
  `parseTemplate`. `parseTemplate(raw)` alone never loads or runs any file.

### Template-supplied regular expressions (ReDoS)

A template's `regex` modifier is compiled and tested against document values.
Every such pattern is routed through a ReDoS guard that runs at schema-build
time: it caps the pattern length and statically analyses it, rejecting
exponential-backtracking patterns outright and allowing only low-degree
(≤ 2) polynomial patterns. An unsafe pattern fails template parsing with a
`DirectiveError` rather than hanging the validator on a crafted document. The analysis
is slow, so its verdict is memoized per pattern source (at most 1,024 sources; the memo is
cleared when full), and templates that repeat a pattern pay for it once.

### Frontmatter and untrusted keys

YAML frontmatter is parsed with `yaml` (≥ 2), which materialises `__proto__`
and similar keys as ordinary own properties — no prototype pollution. Table
headers and labeled-list keys derived from untrusted markdown are collected into
null-prototype objects for the same reason. Frontmatter is **exposed, not
schema-validated**; validate it yourself in a `*.refine.ts` (which only runs
under the conditions above).

### Filesystem paths (CLI)

`validate-md` reads `--template`/input paths and writes `--emit-json` to any
path you give it, including absolute and `../` paths. This is fine when an
operator runs the CLI, but do not pass attacker-controlled path arguments to it
without confining them yourself.

---

## Design notes

The toolkit composes each section's Zod schema into a single `z.object` and
validates the whole document at once, so refinement callbacks receive a
fully-typed document and errors arrive as a single `ZodError` tree. Structural
failures (missing required section, extra/unordered sections, malformed table)
throw a plain `Error` before Zod runs — structure is checked first, semantics
second. Template-side faults throw `DirectiveError`, which carries and prefixes
`path:line:col` whenever position information is available; `validate-md` does not pass the
template's file to the parser, so the CLI prints that prefix as a literal `template.md:<line>:<col>:` after
`Error: invalid template <file>:`, and an error found after the directive text was read (an unknown kind or
modifier) has no position.

In template mode, `parseTemplate` walks the mdast tree, collects
`<!-- TEMPLATE-ONLY: -->` directives, and infers an extractor + Zod schema for
each H2 section. Section keys are derived from heading text via `headingToKey`
(e.g. `"4. Inputs (Props)"` → `"inputs"`). An optional `*.refine.ts` sibling
can be loaded at runtime to add cross-section invariants without coupling them
to the template syntax.

YAML frontmatter is parsed via `remark-frontmatter` + `yaml` and lifted onto
`doc.frontmatter` alongside the title and sections. It is exposed but not
schema-validated by the parser; frontmatter rules belong in `*.refine.ts`.

---

## Repository layout

| Path                        | What it holds                                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/markdown-schema/` | The package: source (`libs/`), the `validate-md` command (`bin/`, `app/`), the agent skill (`skills/`), examples, tests and the package README |
| `CHANGELOG.md`              | Release notes, one section per version                                                                                                         |

To run the tests, install once and run them from the package folder (Node 24 and pnpm):

```bash
pnpm install
cd packages/markdown-schema
pnpm test        # vitest
pnpm build       # tsdown → dist/
```

## About this repository

This repository is a read-only copy of the `markdown-schema` part of a private repository, made at each release. It holds the source of the version 0.13.9.

| Package | Version | Folder |
| ------- | ------- | ------ |
| `markdown-schema` | 0.13.9 | `packages/markdown-schema` |

The packages are published to npm from the maintainer's machine, from the tagged commit `v<version>` of this repository.

This repository has no lockfile: a lockfile made by the private repository would name its private registry. Install with `pnpm install`; the packages of this repository link to each other as a workspace.

- [CHANGELOG.md](CHANGELOG.md): what changed in each release
