# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

<!-- TEMPLATE-ONLY: guide
// Title: the flow name in Title Case (e.g. "Toggle Favorite", "Sign In").
// Summary: one sentence describing the user-observable outcome.
-->

## 1. Trigger

- Kind: <!-- TEMPLATE-ONLY: enum: ui-event | route-mount | auth-change | cron | external-event; required -->
- Origin: <!-- TEMPLATE-ONLY: string; required -->

<!-- TEMPLATE-ONLY: guide
// What kicks the flow off. Origin names the specific UI element, route
// pattern, store transition, or external signal.
-->

## 2. Preconditions

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// State that must hold before the flow can run: auth, tier, route, cache
// readiness. Write as a bullet list of MUST clauses.
-->

## 3. Steps

| # | Actor | Action | Target |
| - | ----- | ------ | ------ |

<!-- TEMPLATE-ONLY: row; min-rows: 2
"#": string; required; regex `^\d+$`
Actor: enum: ui | container | store | query | mutation | rpc | edge-function | table | external
Action: string; required
Target: string; required
-->

| 1 | container | calls mutation | `@terv-dev/frontend#useToggleFavorite` |

<!-- TEMPLATE-ONLY: guide
// Ordered sequence of effects. Actor + Action + Target make each step
// auditable. Target uses canonical symbol citations or table/RPC names.
// ≥2 steps required — a single step is not a flow.
-->

## 4. State changes

| Surface | Change |
| ------- | ------ |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Surface: enum: store | query-cache | table | url | session | external
Change: string; required
-->

| query-cache | optimistic prepend to `favoritesKeys.list()` |

<!-- TEMPLATE-ONLY: guide
// Where state mutates and how. One row per affected surface. Optimistic
// updates and their rollback paths both appear here.
-->

## 5. Side effects

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Toasts, navigation, analytics, logs, network calls beyond those in §3.
// Omit the section when none.
-->

## 6. Failure modes

| Where | Symptom | Rollback |
| ----- | ------- | -------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Where: string; required
Symptom: string; required
Rollback: string; required
-->

| INSERT to user_favorites | RLS denies | mutation `onError` restores snapshot |

<!-- TEMPLATE-ONLY: guide
// Each known failure point of the flow: which step might fail, what the
// user observes, what compensates. Cover at least every external call.
-->

## 7. Postconditions

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// State that holds after a successful run. Mirrors §2 preconditions —
// reader can verify before/after.
-->

## 8. References

| Kind | Reference |
| ---- | --------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Kind: enum: feature | view-component | store | query | table | rpc | edge-function | ts-type | doc
Reference: string; required; regex `^(\.{1,2}/|/)[A-Za-z0-9_./-]+\.md$|^@[a-z0-9_-]+/[a-z0-9_.-]+#[A-Za-z_][A-Za-z0-9_.]*$`
-->

| feature | `/apps/terv-dev/layered-docs/2.packages/3.terv-dev-frontend/4.features/5.favorites.feature.md` |

<!-- TEMPLATE-ONLY: guide
// Every spec doc this flow cites. Doc references are plain-text paths
// (relative for same-tier, repo-root absolute with a leading `/` for
// cross-tier). Symbol citations use the canonical
// `@<group>/<pkg>#<Symbol>` form. Plain text rather than markdown link
// syntax because refines need URL visibility.
-->

## 9. Notes

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Open questions, deferred decisions, history of changes to the flow.
-->
