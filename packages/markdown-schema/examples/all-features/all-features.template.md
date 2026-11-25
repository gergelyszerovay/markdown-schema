<!-- TEMPLATE-ONLY: guide
// Showcase template covering every directive of the grammar:
//
// Inline directives (close on the same line):
//   - typed H1 placeholder, and the summary blockquote under it.
//   - `string` with modifiers (regex, required/optional, default=, only-if).
//     `regex` is a modifier of `string`, not a type of its own.
//   - `enum:` directive with `\|` and `\\` escapes for choices.
//   - inline directive on the first H3 of a repeated section.
//
// Block directives (opener on its own line, closer `-->` on its own line):
//   - `guide` for author-facing prose (this block is one).
//   - `document` for document-level options (`open`, `unordered`).
//   - `row` for table row schemas. Modifiers (`min-rows: N`,
//     `max-rows: N`) live on the opener line; a column can be a `key`
//     or a `checkbox`.
//   - `section` for section-level constraints. Single-line in the common
//     case: `<!-- TEMPLATE-ONLY: section; optional; remove-if Key=Value -->`.
//     It also carries `min-groups`/`max-groups` for repeated sections and
//     `min-items`/`max-items`/`regex` for task lists.
//   - `freetext` for a free-form markdown section.
//
// The engine fails closed: a filled document that ADDS an unknown `##`
// section, ADDS an undeclared labeled-list key, or leaves a `required`
// cell/field blank is rejected — not silently accepted. Sections must
// follow the template order unless the template says `document; unordered`,
// as this one does.
-->

<!-- TEMPLATE-ONLY: guide
// Plain English title for this document, e.g. "Order Form 2026 Q2".
-->

# All-Features Showcase: <!-- TEMPLATE-ONLY: string; required -->

<!-- TEMPLATE-ONLY: document; unordered -->

<!-- TEMPLATE-ONLY: guide
// One sentence that says what this document is about, as a blockquote.
-->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

## 1. Inline: Required Fields

<!-- TEMPLATE-ONLY: guide
// Required string fields. The plain `string; required` form accepts any
// non-empty value; add `regex` as a modifier when you need a stricter
// shape: `string; regex \`...\`; required`.
-->

- Name: <!-- TEMPLATE-ONLY: string; required -->
- SKU: <!-- TEMPLATE-ONLY: string; regex `^[A-Z]{3}-\d{4}$`; required -->

## 2. Inline: Optional Fields

<!-- TEMPLATE-ONLY: guide
// An optional field may be left blank or its line removed; the list
// itself must keep at least one item.
-->

- Nickname: <!-- TEMPLATE-ONLY: string; optional -->
- Tier: <!-- TEMPLATE-ONLY: enum: Free | Pro | Enterprise; optional -->

## 3. Inline: Enums

<!-- TEMPLATE-ONLY: guide
// `enum:` is the inline form of a fixed choice list. Choices are
// separated by `|` and trimmed; the schema becomes `z.enum([...])`.
// Use GA only after the release has shipped to all customers.
-->

- Stage: <!-- TEMPLATE-ONLY: enum: Alpha | Beta | GA; required -->
- Priority: <!-- TEMPLATE-ONLY: enum: Low | Medium | High; required -->

## 4. Inline: Enum Values With Escaped Pipes

<!-- TEMPLATE-ONLY: guide
// Inside an enum choice, `\|` is a literal `|` and `\\` is a literal `\`.
// Below, `A \| B (either)` is ONE choice whose label contains a pipe;
// `C \\ D` is ONE choice whose label contains a backslash.
-->

- Logical Op: <!-- TEMPLATE-ONLY: enum: AND | OR | A \| B (either) | C \\ D; required -->

## 5. Inline: Conditional Field (`only-if`)

<!-- TEMPLATE-ONLY: guide
// `only-if Key=Value` allows a field to be present only when the named
// sibling field equals the given value. Fill `Card Last 4` only when
// `Plan Type` is `Paid`.
-->

- Plan Type: <!-- TEMPLATE-ONLY: enum: Free | Paid; required -->
- Card Last 4: <!-- TEMPLATE-ONLY: string; regex `^\d{4}$`; optional; only-if Plan Type=Paid -->

## 6. Inline: Default Value

<!-- TEMPLATE-ONLY: guide
// `default=<value>` supplies a fallback when the author leaves the field
// blank. The default is applied at validation time (it appears in the emitted
// JSON) and does not appear pre-filled in the template. A field carrying
// `default=` is implicitly optional; empty `default=` means "blank allowed".
// Combining an explicit `required` with `default=` is a template error.
-->

- Currency: <!-- TEMPLATE-ONLY: string; optional; default=USD -->

## 7. Inline: H3 Directive in a Repeated Section

<!-- TEMPLATE-ONLY: guide
// A section made of repeated H3 sub-groups. The directive on the FIRST H3
// validates every group's heading text; `min-groups`/`max-groups` on the
// `section` directive bound the number of groups. Add as many H3 blocks as
// you need; each becomes one `{ heading, items }` entry. Each group's body
// must be a bullet list, but its items are not checked.
-->

<!-- TEMPLATE-ONLY: section; min-groups: 1; max-groups: 20 -->

### <!-- TEMPLATE-ONLY: string; regex `^(add|fix|chore): .+$`; required -->

<!-- TEMPLATE-ONLY: guide
// One bullet per detail of the change.
-->

- <!-- TEMPLATE-ONLY: string; required -->

## 8. Block: Table with `row` Directive

<!-- TEMPLATE-ONLY: guide
// `row` is a block directive whose body is column specs. Table-level
// modifiers (`min-rows: N`, `max-rows: N`) live on the opener line,
// semicolon-separated. Column specs use the same field grammar as inline
// directives: `Header: string; required`, `Header: enum: A | B; required`.
-->

| Prop Name | Type | Required | Description |
| --------- | ---- | -------- | ----------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1; max-rows: 50
Prop Name: string; regex `^[a-z][a-zA-Z0-9]*$`; required
Type: string; required
Required: enum: Yes | No; required
Description: string; required
-->

| propName | string | Yes | Short description. |

## 9. Block: `section` Directive

<!-- TEMPLATE-ONLY: guide
// `section` carries section-level rules on the opener line. Single-line
// in the common case. Here we mark §9 optional and require it absent
// when the document's Plan Type is "Free" (no notes for free-tier docs).
-->

<!-- TEMPLATE-ONLY: section; optional; remove-if Plan Type=Free -->

- Notes: <!-- TEMPLATE-ONLY: string; optional -->

<!-- TEMPLATE-ONLY: guide
// Free-text sections accept any markdown content: paragraphs, code blocks,
// lists, tables, blockquotes, thematic breaks, H3+ headings. The section's
// JSON value is the body serialized back to a markdown string.
// H3+ headings are preserved as content; they do NOT split the section into
// repeated groups. TEMPLATE-ONLY directives are forbidden inside the body.
// Place `guide` blocks above the H2, not inside the section.
-->

## 10. Block: Free-Text Section

<!-- TEMPLATE-ONLY: freetext; required -->

A free-form description paragraph.

```ts
const example = "code block preserved";
```

- bullet one
- bullet two

> A blockquote.

---

### Sub-heading inside free-text

More content under an H3.

## 11. Block: Keyed Table with a Checkbox Column

<!-- TEMPLATE-ONLY: guide
// `key` marks the column whose values identify the rows (unique across every
// key column of the document); `checkbox` cells are `[ ]` or `[x]` and parse
// to booleans. Lines starting with `//` inside a `row` body are skipped.
-->

| ID  | Task | Done |
| --- | ---- | ---- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
// ID is the row's identifier, e.g. T-1.
ID: string; regex `^T-\d+$`; key
Task: string; required
Done: checkbox
-->

| T-1 | Sample task. | [ ] |

## 12. Block: Task List with Item Rules

<!-- TEMPLATE-ONLY: guide
// A task list (`- [ ]` / `- [x]`). `min-items`, `max-items` and `regex` on
// the `section` directive bound the number of items and the text of each;
// whether an item is checked is not constrained.
-->

<!-- TEMPLATE-ONLY: section; min-items: 1; max-items: 10; regex `^[A-Z].+$` -->

- [ ] <!-- TEMPLATE-ONLY: string; required -->
