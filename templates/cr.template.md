# CR-<!-- TEMPLATE-ONLY: string; required; regex `\d{4}` -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

<!-- TEMPLATE-ONLY: guide
// Title format: `CR-<NNNN>` (literal "CR-" + zero-padded 4-digit numeric
// ID). The descriptive short name lives in the summary line — one
// sentence, 10-200 chars.
-->

## 1. Intent

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// What you want, in your own words. Terse is fine — this is the human
// intent, not a structured plan. The cr-plan doc is generated from this.
// 1–5 paragraphs typical.
-->

## 2. Motivation

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Why this matters. What problem, incident, request, or opportunity
// drives the work. Skip restating the intent.
-->

## 3. Context

<!-- TEMPLATE-ONLY: section; optional -->

| Kind | Reference |
| ---- | --------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Kind: enum: cr | spec | symbol | issue | url
Reference: string; required
-->

| spec | /apps/terv-dev/layered-docs/... |

<!-- TEMPLATE-ONLY: guide
// Optional. Links to related CRs, spec docs the work touches, symbol
// citations, tracker issues, or external URLs. References are PLAIN TEXT
// (no markdown link syntax) so refines and the cr-plan generator see the
// full URL — `mdast-util-to-string` strips link markup from table cells.
//
// Forms by Kind:
//   cr     — plain path, e.g. `apps/terv-dev/layered-docs/cr/0032.cr.md`
//   spec   — plain path, repo-root absolute for cross-tier targets
//   symbol — canonical `@<group>/<pkg>#<Symbol>`
//   issue  — tracker URL or `#<number>` shorthand
//   url    — full `https://…` URL
-->

## 4. Constraints

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// What MUST hold; what to avoid. Examples: "must not change DB schema",
// "must work in dev without Supabase", "must not break public route
// prerendering". Omit the section if no hard constraints.
-->

## 5. Out of scope

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Things this CR deliberately does NOT do, to prevent scope creep
// during planning. Optional.
-->

## 6. Status

- State: <!-- TEMPLATE-ONLY: enum: draft | planned | in-progress | implemented | shipped; required -->

<!-- TEMPLATE-ONLY: guide
// State transitions:
//   draft       — intent captured, no plan yet
//   planned     — cr-plan.md exists and has been human-reviewed
//   in-progress — implementation underway, specs being updated
//   implemented — code complete, cr-summary.md generated
//   shipped     — PR merged
// Hand-edited; no automation moves it.
-->

## 7. Links

<!-- TEMPLATE-ONLY: section; optional -->

| Kind | URL |
| ---- | --- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Kind: enum: pr | issue | branch | doc | external
URL: string; required
-->

| pr | https://github.com/... |

<!-- TEMPLATE-ONLY: guide
// External references (PR, issue tracker, branch). Filled in as work
// progresses. Omit the section while the CR is `draft`.
-->
