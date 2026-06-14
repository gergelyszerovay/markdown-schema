# Markdown Template Authoring Guide

A practical guide for authoring and validating markdown templates that
pair with `markdown-schema` schemas.

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
closer (`-->`) on its own line. Bodies span multiple lines. **Body lines must
start at column 0** (no leading whitespace).

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

The block kinds are `freetext`, `row`, `section`, and `guide`.

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
- `regex` — pattern validated by `new RegExp(pattern)`, written between backticks in the directive. Note: `regex` is a **modifier** of `string`, not a type of its own. A bare `regex` without a leading `string;` is a hard error.
- `default=<value>` — fallback when the value is blank
- `only-if <Key>=<Value>` — field is permitted only when the named sibling
  field equals the given value (enforced as a `superRefine` on the section)

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

### H3 directive (in repeated sections)

Sections that contain repeated H3 sub-groups can validate each H3's heading
text. Place an inline directive inside the H3:

```markdown
## Changes

### <!-- TEMPLATE-ONLY: string; regex `^(add|fix|chore): .+$`; required -->

Description of the change.
```

After filling, an H3 reads e.g. `### add: loadPlugin()`. Only `string` and
`enum:` directives are allowed in H3s.

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
- **Body**: one column spec per line. Each spec is `Header: <field-modifiers>`,
  where field modifiers are the same grammar as inline `string` / `enum:`
  directives. Column header text matches the GFM table header literally
  (preserves spaces and casing).

### `section` — section-level constraints (block directive)

Placed immediately under the section's H2. In most cases it fits on one line:

```markdown
## 7. Internal State

<!-- TEMPLATE-ONLY: section; optional; remove-if Type=View -->
```

Modifiers (opener-line, semicolon-separated):

- `optional` — the H2 may be absent in the filled doc; the section's JSON
  value is `undefined`.
- `remove-if <Key>=<Value>` — the section must be absent when the named
  sibling field equals the value. Present when it shouldn't be → hard error.
- `min-groups: N` / `max-groups: N` — for repeated sections (H3 sub-groups),
  enforces the count of groups.

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
field, list, table, sub-heading, or section it documents. A `guide` at the
top of a section documents the whole section; one at the top of the file
documents the whole template. The parser doesn't enforce placement, but
authors read top-to-bottom and expect explanation before the thing being
explained.

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

| Body shape                                  | Extractor    | Returns                                           |
| ------------------------------------------- | ------------ | ------------------------------------------------- |
| `freetext` directive present                | `freetext`   | `string` (markdown source, round-tripped)         |
| Sub-headings (H3 inside H2)                 | `repeated`   | `{ heading: string; items: string[] }[]`          |
| GFM table (with `row` directive)            | `table`      | `Record<string, string>[]`                        |
| Labeled bullet list (`- Key: value`)        | `bulletList` | `Record<string, string \| undefined>`             |
| GFM task list (`- [ ]` / `- [x]`)           | `taskList`   | `{ checked: boolean; text: string }[]`            |
| Plain unordered bullet list                 | `bulletList` | `string[]`                                        |
| None of the above (no `freetext` directive) | **error**    | "no recognized shape; add a `freetext` directive" |

The H2 heading text becomes the JSON key (via `headingToKey`, e.g.
`## 1. Internal State` → `internalState`). The section's value is whatever
the inferred extractor produces.

## Cross-Section Invariants (`*.refine.ts`)

Rules that span more than one section belong in a `*.refine.ts` sibling.
The CLI auto-discovers it; no directive is required to enable it.

```ts
// component.refine.ts
import type { z } from "zod";

export const refine = (doc: any, ctx: z.core.$RefinementCtx): void => {
  const classification = doc.classification as Record<
    string,
    string | undefined
  >;
  if (
    classification["Type"] === "View" &&
    Array.isArray(doc.internalState) &&
    doc.internalState.length > 0
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["internalState"],
      message: "View components must not have internal state",
    });
  }
};
```

Document each invariant in a `guide` block under the H1 so authors filling
the template know what cross-section rules apply.

## Authoring Workflow

1. Copy the `*.template.md` file to a new document.
2. Read every `<!-- TEMPLATE-ONLY: guide ... -->` block — that's where the
   template author put guidance for you.
3. Read every other `<!-- TEMPLATE-ONLY: -->` directive to understand each
   section's structure and constraints.
4. Fill in each section:
   - **inline directive** (`string`, `enum:`): write the value, delete the
     `<!-- TEMPLATE-ONLY: ... -->` comment.
   - **`row` directive**: replace the sample row(s) with real data. Delete
     the `row` directive block (it sits between separator and sample row,
     not in the filled doc).
   - **`section` directive**: add content for the section; delete the entire
     section's H2 + body if the directive marks it `optional` or
     `remove-if` says to remove it.
   - **`guide` block**: delete it (or leave it — it's invisible in rendered
     markdown either way, but cleaner without).
5. Run `validate-md --template component.template.md example.md` and confirm `OK`.
6. Grep for leftover directives: `grep '<!-- TEMPLATE-ONLY' example.md` must
   return empty.

## Filling Checklist

- [ ] All `<!-- TEMPLATE-ONLY: -->` comment blocks replaced or removed
- [ ] No placeholder text remains outside comment blocks
- [ ] `enum:` choices collapsed to a single value (with escapes preserved if
      the choice contained `|` or `\`)
- [ ] All required fields and table columns are populated
- [ ] Optional sections removed if not applicable (or populated if present)
- [ ] Cross-section invariants (per the H1 `guide` block and `*.refine.ts`)
      are satisfied
- [ ] `validate-md --template <template> <doc>` prints `OK`
- [ ] `grep '<!-- TEMPLATE-ONLY' <doc>` returns empty

## Validation Error Interpretation

`validate-md` prints three kinds of errors:

**Directive errors** (`DirectiveError`): the _template_ itself is malformed
— unknown keyword, multi-line inline directive, indented body line, etc.
Fix the template, not the filled doc. Includes file/line/column.

```
component.template.md:18:3: unknown TEMPLATE-ONLY directive kind: "pik one"
component.template.md:42:1: inline TEMPLATE-ONLY directive must close on the same line; "-->" not found before line end
```

**Structural errors** (`Error.message`): the filled document is missing a
required heading, a required table, or has a malformed structure.

```
example.md: schema validation failed
  - inputs: must contain a table
```

**Zod issue list** (`path: message`): the document has the right structure
but a value violates a directive constraint or refine rule. Fix the value.

```
example.md: schema validation failed
  - classification.Type: Invalid option: expected one of "Root", "Layout", ...
  - internalState: View components must not have internal state
```

When an issue path doesn't map to a single section's schema (e.g. path is
`internalState` but the error mentions another section's field), suspect a
cross-section refine. Check the `*.refine.ts` source.

**Common false alarms:**

- Leftover `<!-- TEMPLATE-ONLY: -->` blocks in the filled document — grep for them.
- Heading text drift (changed heading after filling) — compare to template.
- Smart quotes from copy-paste (`"` instead of `"`) — replace with straight quotes.
- A choice that contains `|` written without `\|` escape — read the directive's
  expected choices carefully.
