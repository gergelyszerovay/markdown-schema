# markdown-schema

Turn a human-readable markdown document into **typed, validated, structured
data** — define the shape once, then parse every document that follows it into a
JSON object you can query, transform, and render.

## Goals

- **One source of truth.** Authors edit plain markdown in any editor; tools
  consume the same file as structured data. The structure is _derived_, never
  duplicated.
- **Markdown you can compute over, not just display.** A parsed document is a
  typed object (`frontmatter` + `title` + section keys), so a renderer reads
  `doc.frontmatter.colors` or `doc.endpoints[]` directly — no inline regex, no
  string-hunting.
- **Correctness you can enforce in CI.** Every document is validated against a
  Zod schema. A doc that drifts from its shape — a missing section, a malformed
  table, a broken cross-reference — fails the `validate-md` CLI.
- **Author-friendly, machine-readable.** The markdown stays readable and
  diff-friendly; downstream gets the rigor of a typed payload.

### Why structured data beats raw markdown

Raw markdown can only be _displayed_. Once parsed into typed fields, the same
file drives many renderings. Two examples, each from a single markdown file:

- **A design-token doc** — following Google Labs'
  [DESIGN.md specification](https://stitch.withgoogle.com/docs/design-md/specification)
  ([source](https://github.com/google-labs-code/design.md)), where YAML
  frontmatter holds machine-readable tokens (the _what_) and the markdown body
  holds human-readable design rationale (the _why_). The frontmatter parses into
  typed maps (`colors`, `typography`, `spacing`, `rounded`, `components`), so a
  renderer can show colors as **interactive swatches**, typography as **live
  font specimens**, spacing as **dimension bars**, and resolve
  `{foreground}`-style token references against the color map at render time. Raw
  markdown would show `#3d6e6c` as text; structured data shows the colour.
- **A system-overview doc** — GFM tables parse into typed row arrays
  (`nodes[]`, `edges[]`, `groups[]`, `layoutHints[]`), which a renderer can turn
  into a **diagram**: filter nodes by deployment mode without re-parsing, lay
  them out from numeric position hints, compute group bounding boxes, and route
  edges by geometry. Raw markdown is a table you read; structured data is a graph
  you filter and lay out.

The trade is parse-once-up-front for query-and-render-many afterwards.

## Two ways to define a shape

- **Template mode** (recommended for most docs) — write a `*.template.md` file
  with `<!-- TEMPLATE-ONLY: -->` directives; the schema is derived automatically
  at runtime. No separate TypeScript file, and it powers the `validate-md` CLI.
- **Programmatic mode** (advanced) — define the schema in TypeScript with
  `defineDocSchema` when you need full static types, custom extractors, or shapes
  the directive grammar can't express (geometry, cross-section invariants).

Both modes parse a leading YAML **frontmatter** block when present and expose it
as `doc.frontmatter` — see [Frontmatter](#frontmatter).

## Install

```bash
pnpm add markdown-schema
```

The core API (`parseTemplate`, `defineDocSchema`, extractors) runs in the
**browser and Node**. Filesystem helpers (`loadRefine`) and the CLI are
Node-only — see [Entry points](#entry-points).

---

## Agent skill

The package ships an **agent skill** that teaches a coding agent (Claude Code,
Cursor, Codex, and 70+ others) the three template-mode workflows:

- **Authoring** a `*.template.md` — choosing directives, splitting sections, and
  deciding what belongs in a `*.refine.ts` companion.
- **Filling** a template — replacing `<!-- TEMPLATE-ONLY: -->` directives with
  real content.
- **Validating** a document with `validate-md`, including how to read and triage
  its error output.

It encodes the directive grammar, a which-directive decision table, the
template-vs-`*.refine.ts` boundary, and a triage table for common failures, so
the agent gets these workflows right without re-deriving the rules each time.

### Installing the skill

Use the [`skills`](https://github.com/vercel-labs/skills) CLI — the open
agent-skills installer. It copies the skill into your agent's skills directory
(`.claude/skills/`, `.cursor/skills/`, …) and auto-detects which agents you have:

```bash
# install the skill from this repo into the current project
npx skills add gergelyszerovay/markdown-schema --skill markdown-schema

# …or globally (~/.claude/skills/, ~/.cursor/skills/, …)
npx skills add gergelyszerovay/markdown-schema --skill markdown-schema -g
```

The skill source lives under
[`.claude/skills/markdown-schema/`](.claude/skills/markdown-schema/):

| File                             | Role                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `SKILL.md`                       | Skill entry point — triggers and the three workflows     |
| `markdown-schema.guideline.md` | Source of truth for the `<!-- TEMPLATE-ONLY: -->` grammar |

> Agents do **not** scan `node_modules`, so installing the npm package alone does
> not register the skill — use `npx skills add` (above) to copy it onto a skills
> path. As a fallback you can copy the directory manually into `.claude/skills/`.

Once installed, the agent triggers it automatically when you ask to author,
fill, or validate a `*.template.md`.

---

## Template mode

### 1. Write a template

`*.template.md` files use `<!-- TEMPLATE-ONLY: ... -->` HTML comments to embed
schema directives and author-facing prose. Everything outside the comments is
fixed structure that every filled instance must preserve.

Directives come in two structural shapes:

- **Inline directives** sit _inside_ a heading, list item, or paragraph and
  must close on the same line as the opener.
- **Block directives** sit on their own line, opener at column ≤ 3, closer
  on its own line. Body lines must start at column 0.

Author-facing prose lives in standalone `guide` block directives — `//`-prefixed
lines, ignored by the parser. Place them immediately before the field, list,
table, or section they document.

```markdown
<!-- TEMPLATE-ONLY: guide
// Short product name + release date, e.g. "Acme 2.4 — 2026-05-08".
-->

# Release Notes: <!-- TEMPLATE-ONLY: string; required -->

## 1. Metadata

- Version: <!-- TEMPLATE-ONLY: string; regex `^\d+\.\d+\.\d+$`; required -->

<!-- TEMPLATE-ONLY: guide
// Use GA only after the release has shipped to all customers.
-->

- Stage: <!-- TEMPLATE-ONLY: enum: Alpha | Beta | GA; required -->

## 2. Highlights

<!-- TEMPLATE-ONLY: guide
// One concise sentence per bullet. Keep under 80 chars.
-->

- <!-- TEMPLATE-ONLY: string; required -->

## 3. Acceptance Criteria

| ID  | Description | Priority |
| --- | ----------- | -------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; regex `^AC-\d+$`; required
Description: string; required
Priority: enum: Low | Medium | High; required
-->

| AC-001 | Sample criterion. | High |
```

### 2. Fill the template

Replace every `<!-- TEMPLATE-ONLY: … -->` block with actual content:

```markdown
# Release Notes: Widget v2

## 1. Metadata

- Version: 2.0.0
- Stage: GA

## 2. Highlights

- Rewrote the plugin loader to support async plugins

## 3. Acceptance Criteria

| ID     | Description                                  | Priority |
| ------ | -------------------------------------------- | -------- |
| AC-001 | Async plugin loads in < 100 ms               | High     |
| AC-002 | Legacy v1 config emits a deprecation warning | Medium   |
```

### 3. Validate from the CLI

```bash
validate-md --template release.template.md release.md
# release.md: OK
```

### 4. Parse in code

```ts
import { readFileSync } from "node:fs";
import { parseTemplate } from "markdown-schema";

const templateRaw = readFileSync("release.template.md", "utf-8");
const schema = parseTemplate(templateRaw);

const raw = readFileSync("release.md", "utf-8");
const doc = schema.parse(raw);
// doc.metadata → { Version: "2.0.0", Stage: "GA" }
// doc.highlights → ["Rewrote the plugin loader to support async plugins"]
// doc.acceptanceCriteria → [{ ID: "AC-001", Description: "...", Priority: "High" }, ...]
```

### Cross-section invariants (`*.refine.ts`)

For rules that span multiple sections, add a sibling `*.refine.ts`:

```ts
// release.refine.ts
import type { z } from "zod";

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;
  const meta = d["metadata"] as Record<string, string>;
  if (meta["Stage"] !== "GA" && !d["knownIssues"]) {
    ctx.addIssue({
      code: "custom",
      path: ["knownIssues"],
      message: "Non-GA releases must declare known issues",
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
import { parseTemplate } from "markdown-schema";
// loadRefine reads the filesystem, so it ships on the node-only subpath.
import { loadRefine } from "markdown-schema/node";

const refine = await loadRefine("release.template.md");
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
  primary: "#1A1C1E"
  neutral: "#F7F5F2"
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
import type { z } from "zod";

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const fm = (doc as { frontmatter?: { colors?: Record<string, string> } })
    .frontmatter;
  if (!fm?.colors?.["primary"]) {
    ctx.addIssue({
      code: "custom",
      path: ["frontmatter", "colors", "primary"],
      message: "primary color is required",
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
non-whitespace token is the directive kind.

**Inline directives** (must close on the same line as the opener):

| Directive                             | Schema produced                              |
| ------------------------------------- | -------------------------------------------- | ------------------------------- |
| `string; required`                    | `z.string().min(1)`                          |
| `string; optional`                    | `z.string().optional()`                      |
| `string; regex \`^…$\`; required`     | `z.string().regex(…)`                        |
| `string; optional; default=<value>`   | falls back to `<value>` when blank           |
| `string; optional; only-if Key=Value` | field present only when sibling equals value |
| `enum: A \| B \| C; required`         | `z.enum(["A", "B", "C"])`                    |
| `enum: A \\\| B \| C; required`       | choice `"A                                   | B"`, choice `"C"` (`\|` escape) |

`regex` is a modifier of `string`, not a type of its own. A bare `regex` without a leading `string;` is a hard error.

**Block directives** (own-line opener at column ≤ 3; body lines at column 0):

| Directive                                              | Effect                                               |
| ------------------------------------------------------ | ---------------------------------------------------- |
| `freetext; required` / `freetext; optional`            | section body is free-form markdown (see below)       |
| `row; min-rows: N; max-rows: N` + body of column specs | `z.array(z.object({…}))` — one entry per row         |
| `section; optional`                                    | whole section heading may be absent                  |
| `section; remove-if Key=Value`                         | section must be absent when expression holds         |
| `section; min-groups: N` / `max-groups: N`             | for repeated sections, constrain the count of groups |
| `guide` + body of `//` lines                           | author-facing prose; ignored by parser               |

**`row` column specs** use the same grammar as inline `string` / `enum:`
directives — one column per body line, e.g.:

```markdown
<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; regex `^AC-\d+$`; required
Description: string; required
Priority: enum: Low | Medium | High; required
-->
```

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

| Heading level | Inline directive supported?                                           |
| ------------- | --------------------------------------------------------------------- |
| H1            | **Yes** — validates the document title (typed `string` / `enum:`)     |
| H2            | **No** — H2 text is the JSON section key; keys must be fixed          |
| H3            | **Yes, in repeated sections** — validates each per-group heading text |

### Section extractor inference

The parser picks an extractor automatically from the section body shape:

| Body shape                                  | Extractor    | Returns                                           |
| ------------------------------------------- | ------------ | ------------------------------------------------- |
| `freetext` directive present                | `freetext`   | `string` (markdown source, round-tripped)         |
| Sub-headings (H3 inside H2)                 | `repeated`   | `{ heading: string; items: string[] }[]`          |
| GFM table (with `row` directive)            | `table`      | `Record<string, string>[]`                        |
| Labeled bullet list (`- Key: value`)        | `bulletList` | `Record<string, string \| undefined>`             |
| GFM task list (`- [ ]` / `- [x]`)           | `taskList`   | `{ checked: boolean; text: string }[]`            |
| Plain unordered bullet list                 | `bulletList` | `string[]`                                        |
| None of the above (no `freetext` directive) | **error**    | "no recognized shape; add a `freetext` directive" |

---

## Programmatic mode (advanced)

> Most documents are better served by [template mode](#template-mode) — the
> schema lives next to the prose and the CLI validates it. Reach for
> programmatic mode only when you need what's below.

Use `defineDocSchema` when you need full TypeScript types or extractors not
covered by template directives.

### Example

A complete, runnable example lives in
[`examples/programmatic/`](examples/programmatic/) — a release-notes schema that
exercises **every** extractor and `defineDocSchema` option:

| File                                                                      | Role                                                            |
| ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [`release-schema.ts`](examples/programmatic/release-schema.ts)            | The `defineDocSchema` schema (title, all extractors, `refine`) |
| [`release.md`](examples/programmatic/release.md)                          | A filled document that validates against it                    |
| [`run.ts`](examples/programmatic/run.ts)                                  | Parses `release.md` and prints the typed JSON                  |
| [`output/release.json`](examples/programmatic/output/release.json)        | The emitted, validated structured payload                      |

```bash
node --experimental-strip-types examples/programmatic/run.ts
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
import { z } from "zod";
import {
  defineDocSchema,
  freetext,
  table,
  codeBlocks,
  optional,
  repeated,
  repeatedWhere,
} from "markdown-schema";

export const ReleaseDoc = defineDocSchema({
  title: { schema: z.string().regex(/^v\d+\.\d+\.\d+$/, "must be semver") },
  sections: {
    summary: { heading: "Summary", extract: freetext, schema: z.string().min(10) },
    // …
    changes: {
      heading: "Changes",
      extract: repeated({
        shape: { description: freetext, params: optional(table), snippets: codeBlocks },
      }),
      schema: z.array(/* Change */ z.object({})).min(1),
    },
    migration: {
      heading: "Migration",
      extract: repeatedWhere({
        startsAt: (n) => n.type === "thematicBreak",
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

### CLI support

The `validate-md` CLI is **template mode only** — it derives the schema from a
`*.template.md` file. Programmatic schemas (`defineDocSchema`) are used in code;
call `.parse(raw)` directly, as the example above does. The old
`--schema` / `--export` flags were removed in v0.2.0; the CLI now errors and
points to `--template`.

---

## Entry points

The package has two entry points so the core API can bundle for the browser:

| Import path                                | Environment   | Exports                                                            |
| ------------------------------------------ | ------------- | ----------------------------------------------------------------- |
| `markdown-schema`       | browser + node | `parseTemplate`, `defineDocSchema`, all extractors, `headingToKey`, `type RefineFunction` — pure mdast/zod, no node builtins |
| `markdown-schema/node`  | node only     | `loadRefine` — reads the filesystem and dynamically imports `*.refine.ts` |

The `validate-md` CLI is node-only and uses the `/node` entry internally.

---

## API surface

### Template mode

| Export                      | Entry   | Description                                                                |
| --------------------------- | ------- | -------------------------------------------------------------------------- |
| `parseTemplate(raw, opts?)` | `.`     | Parses a `*.template.md` string into a `{ parse(raw) }` schema object      |
| `headingToKey(heading)`     | `.`     | Converts H2 text (e.g. `"1. Summary"`) to a camelCase key (`"summary"`)    |
| `loadRefine(templatePath)`  | `/node` | Dynamically loads the sibling `*.refine.ts`; returns `undefined` if absent |

**`parseTemplate` options (`opts`):**

| Option   | Default | Description                                                          |
| -------- | ------- | ------------------------------------------------------------------- |
| `refine` | —       | Cross-section refinement callback to attach (usually `loadRefine`'s result) |
| `file`   | —       | Source file path used in error messages                             |

### Extractors

| Extractor                                        | Returns                                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `freetext`                                       | Section body serialized back to markdown (all node types preserved)                   |
| `table`                                          | First GFM table as `Record<string, string>[]`; throws if absent                       |
| `bulletList`                                     | Plain list items as `string[]`; labeled list as `Record<string, string \| undefined>` |
| `taskList`                                       | GFM task list as `{ checked: boolean; text: string }[]`; throws if absent             |
| `codeBlocks`                                     | All fenced code blocks as `{ lang: string \| null; value: string }[]`                 |
| `rawNodes`                                       | The raw `RootContent[]` unchanged                                                     |
| `fencedCodeWithMarker({ marker, markerLabel? })` | Code block following an HTML comment matching `marker`                                |
| `optional(ex)`                                   | Wraps any extractor; returns `undefined` instead of throwing                          |
| `repeated({ by?, shape })`                       | Splits by sub-heading; auto-detects depth                                             |
| `repeatedWhere({ startsAt, shape, … })`          | Generic repeating groups driven by a node predicate                                   |

### Doc schema builder

| Export                  | Description                                     |
| ----------------------- | ----------------------------------------------- |
| `defineDocSchema(spec)` | Returns `{ parse(raw: string): DocOf<S> }`      |
| `SectionSpec<S>`        | Type for one section entry                      |
| `DocOf<S>`              | Infers the fully-typed parse result from a spec; includes `frontmatter?: unknown` |

**`defineDocSchema` spec fields:**

| Field          | Default  | Description                                          |
| -------------- | -------- | ---------------------------------------------------- |
| `title`        | —        | `{ schema }` — extracts the H1 as the document title |
| `titleDepth`   | `1`      | Heading depth for the title                          |
| `sectionDepth` | `2`      | Heading depth used as section boundaries             |
| `sections`     | required | Map of output key → `SectionSpec`                    |
| `refine`       | —        | `(doc, ctx) => void` — cross-section Zod refinement  |

**`SectionSpec` fields:**

| Field      | Default     | Description                                       |
| ---------- | ----------- | ------------------------------------------------- |
| `heading`  | section key | Heading text in the document                      |
| `extract`  | required    | Extractor called on the section's body nodes      |
| `schema`   | required    | Zod schema that validates the extracted value     |
| `optional` | `false`     | When `true`, a missing section yields `undefined` |

---

## CLI

```bash
# Validate one or more documents against a template
validate-md --template component.template.md component.md
validate-md --template component.template.md *.md

# Validate and emit the parsed document as JSON (exactly one input file)
validate-md --template component.template.md --emit-json component.json component.md
```

- `--template <file.template.md>` — required; the template that drives the schema.
- `--emit-json <path>` — write the parsed document (sections, title, and
  `frontmatter`) to `<path>` as JSON. Requires exactly one input file.
- `--no-refine` — skip loading the sibling `*.refine.ts`. Use when validating
  **untrusted** templates (see [Security](#security)).

A sibling `*.refine.ts` next to the template is loaded automatically (unless
`--no-refine` is given).

Prints `<file>: OK` on success — or `<file>: OK (wrote <path>)` when
`--emit-json` is set — or `<file>: schema validation failed` with one
`path: message` line per Zod issue on failure. Exits `1` if any file fails, `0`
otherwise.

All status lines are written to **stderr**, so `--emit-json /dev/stdout` yields
clean JSON on stdout (pipeable to `jq`).

### Requirements

- **Node.js ≥ 22.18**. The CLI loads the sibling `*.refine.ts` with Node's
  built-in [type stripping](https://nodejs.org/api/typescript.html#type-stripping)
  (unflagged from 22.18 / 23.6 onward). No `tsx`, `ts-node`, or build step
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
`DirectiveError` rather than hanging the validator on a crafted document.

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
failures (missing required section, malformed table) throw a plain `Error`
before Zod runs — structure is checked first, semantics second.

In template mode, `parseTemplate` walks the mdast tree, collects
`<!-- TEMPLATE-ONLY: -->` directives, and infers an extractor + Zod schema for
each H2 section. Section keys are derived from heading text via `headingToKey`
(e.g. `"4. Inputs (Props)"` → `"inputs"`). An optional `*.refine.ts` sibling
can be loaded at runtime to add cross-section invariants without coupling them
to the template syntax.

YAML frontmatter is parsed via `remark-frontmatter` + `yaml` and lifted onto
`doc.frontmatter` alongside the title and sections. It is exposed but not
schema-validated by the parser; frontmatter rules belong in `*.refine.ts`.
````
