<!-- TEMPLATE-ONLY: guide
// Showcase template covering every directive in the new grammar:
//
// Inline directives (close on the same line):
//   - typed H1 placeholder
//   - `string` with modifiers (regex, required/optional, default=, only-if).
//     `regex` is a modifier of `string`, not a type of its own.
//   - `enum:` directive with `\|` and `\\` escapes for choices.
//   - inline directive on H3 in repeated sections.
//
// Block directives (open at column ≤ 3, body lines at column 0):
//   - `guide` for author-facing prose (this block is one).
//   - `row` for table row schemas. Modifiers (`min-rows: N`,
//     `max-rows: N`) live on the opener line.
//   - `section` for section-level constraints. Single-line in the common
//     case: `<!-- TEMPLATE-ONLY: section; optional; remove-if Key=Value -->`.

-->

<!-- TEMPLATE-ONLY: guide
// Plain English title for this document, e.g. "Order Form 2026 Q2".
-->

# All-Features Showcase: <!-- TEMPLATE-ONLY: string; required -->

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
// Optional fields may be left blank in the filled document.
// For enums, `optional` means the value can be empty — not that you can
// skip the bullet entirely.
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
// blank. The default is applied at validation time; it does not appear
// pre-filled in the template.
-->

- Currency: <!-- TEMPLATE-ONLY: string; optional; default=USD -->

## 7. Inline: H3 Directive in a Repeated Section

<!-- TEMPLATE-ONLY: guide
// A section made of repeated H3 sub-groups. The H3 itself carries an
// inline directive that validates each group's heading text.
// Add as many H3 blocks as you need; each becomes one entry in the
// resulting array.
-->

### <!-- TEMPLATE-ONLY: string; regex `^(add|fix|chore): .+$`; required -->

<!-- TEMPLATE-ONLY: guide
// One short paragraph describing the change.
-->

Description goes here.

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
