<!-- TEMPLATE-ONLY: guide
// One per region whose behaviour needs more than the one line the information
// architecture gives it (product-profile constitution D29): what the user sees
// and does there, and why it behaves that way. Named
// `2.<group>.<place>.<region>.region.md` in the group's layered-docs tree.
//
// The document is the region's single home for requirements. Code doesn't
// restate them: every declaration that implements part of the region carries
// `@region <place>/<region>` in its TSDoc, and a part of a component's template
// that is the region carries `data-region="<region>"`. Specs cite the rows they
// check (`<doc>#R2`) in their metadata.
//
// Every row is keyed, and the keys are unique across the document, so plans,
// issues, specs and code can cite a single row: S for structure, T for
// states, I for interactions, R for rules. A rule about structure can be
// checked by a journey's ARIA snapshot of the Structure rows.
//
// Title: the region's ID, `<place>/<region>`, as in the information
// architecture.
// Summary: what the user does in the region, in one sentence.
//
// The template is open: a region may add a section of its own, such as Open
// questions while its design is being settled.
-->

# <!-- TEMPLATE-ONLY: string; required; regex `^[a-z][a-z0-9-]*/[a-z][a-z0-9-]*$` -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

<!-- TEMPLATE-ONLY: document; open -->

## Structure

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// The region's element tree, one row per kind of element, parents before
// children. It is the accessibility tree: what a journey's ARIA snapshot
// (Playwright `toMatchAriaSnapshot`) can check.
// Element: what it is, in the product's vocabulary.
// Role: its ARIA role and accessible name as the user agent exposes them
// (`combobox "Revision"`, `treeitem`), or `none` for a purely visual element.
// Parent: the S key of the element it sits in (several, comma-separated, when
// it appears under more than one kind), or `—` at the top.
// Shows: its label or content.
// Layout: only constraints that are requirements (a fixed size, no reflow,
// truncation, an overlay), each naming the rule that gives its reason, or `—`.
// Styling that needs no reason (spacing, colours, fonts) stays in the code.
// Selecting it: what happens when the user picks it, or `—`.
// The order of children is a rule, not a column.
-->

| ID  | Element | Role | Parent | Shows | Layout | Selecting it |
| --- | ------- | ---- | ------ | ----- | ------ | ------------ |

<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; key; regex `^S[1-9][0-9]*$`
Element: string; required
Role: string; required
Parent: string; required; regex `^(—|S[1-9][0-9]*(, S[1-9][0-9]*)*)$`
Shows: string; required
Layout: string; required
Selecting it: string; required
-->

| S1 | tool list | `list "Tools"` | — | the tools | — | — |

## States

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Every state the region can be in, such as first load, refreshing, empty,
// error and stale, and what it shows then, including whether its size may
// change.
-->

| ID  | State | Shows |
| --- | ----- | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; key; regex `^T[1-9][0-9]*$`
State: string; required
Shows: string; required
-->

| T1 | first load | the list's frame with a spinner inside it |

## Interactions

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Every input the region handles (pointer, keyboard, typing) and its effect.
-->

| ID  | Input | Effect |
| --- | ----- | ------ |

<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; key; regex `^I[1-9][0-9]*$`
Input: string; required
Effect: string; required
-->

| I1 | Enter on a tool | opens the tool |

## Rules

<!-- TEMPLATE-ONLY: guide
// The requirements: ordering, limits, paging, sizes, anything a change must
// keep. Why: the reason, so a later change can tell whether it still holds.
// Checked by: `spec` (a unit spec citing the row), `journey`, `visual` (a
// screenshot in the implementation notes of the plan that built it) or
// `review`.
-->

| ID  | Rule | Why | Checked by |
| --- | ---- | --- | ---------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; key; regex `^R[1-9][0-9]*$`
Rule: string; required
Why: string; required
Checked by: enum: spec | journey | visual | review; required
-->

| R1 | Tools are listed by name. | Members look tools up by name. | spec |

## Limitations

<!-- TEMPLATE-ONLY: freetext; optional -->

What the region deliberately doesn't do yet, with the roadmap item that will.

## Wireframes

<!-- TEMPLATE-ONLY: freetext; optional -->

A sketch, a picture, or screenshots once it is built.
