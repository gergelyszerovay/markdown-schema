<!-- TEMPLATE-ONLY: guide
// A constitution is the short normative core of a skill, product or package:
// what it must satisfy (requirements), what it deliberately doesn't do
// (non-goals), and what was decided (decisions). Every entry states the
// current truth; the discussion behind it lives in plans, and git keeps
// earlier versions.
//
// Title: the subject's name, e.g. `angular-block-architecture` or `billing`.
// Summary: one sentence stating what the subject is and covers.
//
// IDs are never renumbered or reused. A removed entry leaves a gap. Reword an
// entry in place when you clarify it; when you reverse it, remove it and add
// a new ID, so stale citations stop resolving instead of changing meaning.
//
// Cross-section rules enforced by constitution.refine.ts:
//   - IDs are unique within Requirements, Non-goals and Decisions.
//   - Every Decisions.Serves reference names an existing requirement.
//   - Every requirement is served by at least one decision.
//   - Decisions rows that share a Topic are contiguous.
//   - A pending decision has a Why that names the plan that will build it.
-->

# Constitution: <!-- TEMPLATE-ONLY: string; regex `^[a-z0-9][a-z0-9-]*$`; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,300}$` -->

## 1. Identity

<!-- TEMPLATE-ONLY: guide
// Kind: what the constitution governs. `skill` for an architecture or
// workflow skill, `product` for a product or group of packages (e.g.
// billing), `package` for a single package with decisions of its own.
// Applies to: who or what must follow it, in one line.
// Version: the subject's version, when it has one (skills do).
-->

- Kind: <!-- TEMPLATE-ONLY: enum: skill | product | package; required -->
- Applies to: <!-- TEMPLATE-ONLY: string; required -->
- Version: <!-- TEMPLATE-ONLY: string; regex `^\d+\.\d+\.\d+$`; optional -->

## 2. Requirements

<!-- TEMPLATE-ONLY: guide
// What the subject must satisfy, independent of how. One requirement per
// row, phrased so a decision can be checked against it. IDs are R1, R2, …
-->

| ID  | Requirement |
| --- | ----------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; key; regex `^R[1-9][0-9]*$`; required
Requirement: string; required
-->

| R1 | Every rule is enforceable by a tool or verifiable by a test or review. |

## 3. Non-goals

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// What the subject deliberately doesn't do or cover, to stop recurring
// debates. IDs are N1, N2, … so reviews can cite them.
-->

| ID  | Non-goal |
| --- | -------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; key; regex `^N[1-9][0-9]*$`; required
Non-goal: string; required
-->

| N1 | Not a directory layout; layouts belong to a separate skill. |

## 4. Decisions

<!-- TEMPLATE-ONLY: guide
// What was decided, as current truth, plus decisions already made but not
// yet built, marked `pending`. IDs are D1, D2, …
// Topic: a short group name; keep rows of one topic together.
// Serves: the requirement(s) this decision satisfies, e.g. `R1` or `R2, R5`.
// Checked by: how a violation is found, comma-separated:
//   `tool:<rule>` for a tool rule (a profile rule name once a profile exists),
//   `test` for behaviour verified by tests, `review` for human or agent review.
// Status: optional; empty or `active` for a decision that holds, `pending`
// for one that is decided but not yet built. New work follows a pending
// decision; existing code isn't flagged for not meeting it yet. When it is
// built, change the status in place and keep the ID.
// Why: optional for active decisions, only when the reason isn't obvious;
// required for pending ones, naming the plan or plan step that builds it.
-->

| ID  | Topic | Decision | Serves | Checked by | Status | Why |
| --- | ----- | -------- | ------ | ---------- | ------ | --- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; key; regex `^D[1-9][0-9]*$`; required
Topic: string; required
Decision: string; required
Serves: string; regex `^R[1-9][0-9]*(, R[1-9][0-9]*)*$`; required
Checked by: string; regex `^(review|test|tool:[a-z0-9-]+)(, (review|test|tool:[a-z0-9-]+))*$`; required
Status: enum: active | pending; default=active
Why: string; optional
-->

| D1 | Enforcement | Boundary rules are enforced by dependency-cruiser, including type-only imports. | R1 | tool:acyclic | | |
