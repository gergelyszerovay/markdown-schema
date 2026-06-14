---
name: markdown-schema
description: Author, fill, or validate `*.template.md` files. Use when the user wants to design a new template, complete (fill) a template with real content, validate a filled document against its template using the `validate-md` CLI, or debug a `validate-md` error message. Covers all three workflows for the `markdown-schema` package.
---

# Skill: markdown-schema

Read `markdown-schema.guideline.md` next to this SKILL.md. It is the source
of truth for the directive grammar — `enum:`, field, `row`, `section`, `guide`,
and how they nest inside `<!-- TEMPLATE-ONLY: -->` comments.

This skill covers three workflows. Pick the section matching the user's task.

## Trigger

Use this skill when the user asks to:

- **Author** a template — design, create, or modify a `*.template.md` file;
  add or split sections/columns; choose a directive kind; write a
  cross-section `*.refine.ts` rule.
- **Fill** a template — replace `<!-- TEMPLATE-ONLY: -->` directives with
  real content; complete a partially filled document; debug why
  `validate-md` rejects a filled instance.
- **Validate** a document — run `validate-md`; interpret or debug its error
  output; check whether a filled document satisfies the template.

---

## A. Authoring a template

### Core principles

**Constants outside, variables inside.** Apply the "survives filling" test
to every span of text: if it appears character-for-character in every correctly
filled instance, it's a constant (leave as plain markdown). Otherwise it's a
variable (wrap in `<!-- TEMPLATE-ONLY: -->`).

**Enum-placeholder anti-pattern.** A list of values like `A | B | C` looks
like scaffolding but is actually a placeholder — the author picks one and
deletes the rest. It MUST be inside an `enum:` directive, not outside.

### Decision table: which directive to use

| Situation                                       | Directive                                   |
| ----------------------------------------------- | ------------------------------------------- |
| Author picks exactly one from a fixed list      | `enum: A \| B \| C; required`               |
| Author writes a free-form string (required)     | `string; required`                          |
| Author writes a free-form string (optional)     | `string; optional`                          |
| Value must match a regex pattern                | `string; regex \`^...$\`; required`         |
| Value is only valid when another field equals X | `...; only-if FieldName=X`                  |
| Author-facing guidance (ignored by parser)      | `guide` block with `//`-prefixed lines      |
| Table where every row must conform to a schema  | `row; min-rows: N` block directive          |
| Section or table may be absent                  | `<!-- TEMPLATE-ONLY: section; optional -->` |
| Section must be absent when a condition holds   | `section; remove-if FieldName=Value`        |
| Section has sub-groups; need ≥ N groups         | `section; min-groups: N`                    |

### Boundary: what can't go in a directive

These invariants **cannot** be expressed as directives and belong in `*.refine.ts`:

- Set membership across two sections (e.g. event names in one section must
  appear in another section's table)
- Conditional requirements spanning more than one section
- Arithmetic on counts or values
- Pattern matching across free-form prose

### Writing a `*.refine.ts` companion

Rules:

- Filename: `<stem>.refine.ts` (sibling to `<stem>.template.md`)
- Export: named `refine` function
- Signature: `(doc: any, ctx: z.core.$RefinementCtx) => void`
- Use `ctx.addIssue({ code: "custom", path: [...], message: "..." })` for each violation

Working stub:

```ts
import type { z } from "zod";

export const refine = (doc: any, ctx: z.core.$RefinementCtx): void => {
  // Rule: ...
};
```

**Document rules in `guide` blocks.** Every cross-section rule enforced in
`*.refine.ts` MUST have a matching `// ...` line in a `guide` block at the
top of the template. Every `//` rule in the opening `guide` block MUST be
enforced by code in `*.refine.ts`.

### Round-trip validation

After modifying a template:

1. Fill the template (use the **Fill** workflow below or do it manually).
2. Write at least one **negative fixture** per refine rule (a doc that violates the rule).
3. Run `validate-md --template <template> <doc>` on both happy and sad paths.
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
3. Add the body: table with `row` directive, labeled list with `field`/`enum:`
   directives, or prose placeholder.
4. Update `headingToKey` mappings if needed (the key is auto-derived from the
   heading text via camelCase).
5. If the section participates in cross-section invariants, update `*.refine.ts`
   and the opening `guide` block at the top of the template.

---

## B. Filling a template

### 1. Pre-flight

Before writing anything:

1. Read the `*.template.md` to understand the full schema.
2. Read the sibling `*.refine.ts` (if present) to understand cross-section invariants.
3. Read the opening `<!-- TEMPLATE-ONLY: guide -->` block at the top of the template
   for the prose list of cross-section rules.

### 2. Fill each section

Work section by section, applying these rules per directive kind:

**`enum:` directive:**

- Write exactly one of the listed choices after the label colon.
- Delete the entire `<!-- TEMPLATE-ONLY: ... -->` inline block.
- Example: `- Type: View` (not `- Type: Root | Layout | View | ...`)

**Field directive (`string`):**

- Write the value after the label colon.
- Delete the `<!-- TEMPLATE-ONLY: ... -->` inline block.
- If `optional` and not applicable, either omit the value (leave blank after colon) or remove the line.
- Respect `only-if <Key>=<Value>`: only include the field when the named field equals the given value.

**`row` directive (table):**

- Replace the sample rows with real data rows.
- The `<!-- TEMPLATE-ONLY: row ... -->` block is in the template only; it won't appear in a correctly filled document.
- Respect `required` columns (must have a value) and `enum: A | B` columns (value must be one of the choices).
- Respect `min-rows: N` — the table needs at least N data rows.

**`section` directive:**

- If marked `optional` and not applicable: delete the entire section (heading + body).
- If `remove-if <Key>=<Value>` applies to the current doc's field value: delete the section.
- Otherwise: fill the section body according to the body shape (table, list, etc.).

**`guide` blocks:**

- These are documentation only — author-facing prose. Do not include them in the filled document.

### 3. Cross-reference checklist

Every backtick-quoted identifier in prose sections (event names, prop names,
state keys) must resolve against the table that declares it. Check especially:

- Event names in Visual State `Visuals:` lines → declared in the Outputs table.
- Prop names in descriptions → declared in the Inputs table.

### 4. Validate

Run: `validate-md --template <template-file> <filled-doc>`

Do not claim done until it prints `OK`. Use the **Validate** workflow below
to interpret any errors.

### 5. Final grep

`grep '<!-- TEMPLATE-ONLY' <filled-doc>` must return empty.

### Common fill failures

| Error signature                                | Cause                               | Fix                                              |
| ---------------------------------------------- | ----------------------------------- | ------------------------------------------------ |
| `Invalid option: expected one of ...`          | `enum:` field has wrong value       | Use exactly one listed choice                    |
| `does not match required format`               | `regex` modifier violated           | Fix the value format                             |
| `is required`                                  | Required field left blank           | Provide a value                                  |
| `must contain a table`                         | Table section is empty or absent    | Add the required table                           |
| `Missing required section`                     | Required H2 heading deleted         | Restore the heading                              |
| `Too small: N`                                 | `min-rows` or `min-groups` violated | Add more rows/groups                             |
| `View components must not have internal state` | Cross-section refine                | Remove the Internal State section or change Type |
| Event `onXxx` not declared                     | Cross-section refine                | Add the event to the Outputs table               |

---

## C. Validating a document

### 1. Locate the template

1. Look for a sibling `*.template.md` with the same stem as the document.
2. If none, walk parent directories until a `*.template.md` is found.
3. Check for a sibling `*.refine.ts` — its rules are enforced by the schema.

### 2. Always invoke the CLI

Never reimplement parsing inline. Always use:

```sh
validate-md --template <template-file> <doc-file>
```

### 3. Interpret the output

**`OK`** — document passes all schema and refine checks.

**Structural error** (single line, no path prefix):

```
example.md: must contain a table
```

The document is missing required structure. Fix the document shape (heading
present but body wrong), not the values.

**Zod issue list** (indented `path: message` lines):

```
example.md: schema validation failed
  - classification.Type: Invalid option: expected one of "Root"|"Layout"|...
  - internalState: View components must not have internal state
```

The document has the right structure but values violate constraints.

### 4. Triage by error type

| Error signature                       | Source                            | Remediation                           |
| ------------------------------------- | --------------------------------- | ------------------------------------- |
| `Invalid option: expected one of ...` | `enum:` directive                 | Use exactly one listed choice         |
| `does not match required format`      | `regex` modifier                  | Fix value to match the pattern        |
| `is required`                         | field `required` modifier         | Provide a non-empty value             |
| `must contain a table`                | `row` directive / table extractor | Add the required GFM table            |
| `Missing required section: "..."`     | required H2 missing               | Restore the section heading           |
| `Too small: N`                        | `min-rows` or `min-groups`        | Add more rows or groups               |
| Refine message (cross-section)        | `*.refine.ts`                     | See opening `guide` block in template |

### 5. Refine-rule diagnostics

When an issue path doesn't map cleanly to one section (e.g. `internalState`
error mentions Type from another section), it's a refine violation:

1. Read the opening `<!-- TEMPLATE-ONLY: guide -->` block in the template for the prose rules.
2. Open the sibling `*.refine.ts` to find the corresponding `ctx.addIssue`.
3. The `path` in the issue points to the section that needs to change.

### 6. Common false alarms

- **Leftover `TEMPLATE-ONLY` blocks** — `grep '<!-- TEMPLATE-ONLY' <doc>` shows
  directives not removed after filling. Delete them.
- **Heading text drift** — edited a heading after filling; compare to template.
- **Smart quotes** — `"` from copy-paste instead of `"`. Replace with straight quotes.

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
