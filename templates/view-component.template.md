# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

<!-- TEMPLATE-ONLY: guide
// Title: the React symbol verbatim (e.g. `FavoriteButtonView`,
// `LayoutView`, `Glossary`). Summary: one sentence stating what the
// component renders.
-->

## 1. Source

- Symbol: <!-- TEMPLATE-ONLY: string; required; regex `^@[a-z0-9_-]+/[a-z0-9_.-]+#[A-Z][A-Za-z0-9_]*$` -->
- Kind: <!-- TEMPLATE-ONLY: enum: View | Container | Container+View | ViewStateHook; required -->
- Sibling View: <!-- TEMPLATE-ONLY: string; default=n/a -->

<!-- TEMPLATE-ONLY: guide
// Kind values follow /root-layered-docs/1.architecture/2.react-view-component.spec.md:
//   View           — presentational, no effects/stores/data fetching.
//   Container      — wires effects/stores/data; renders non-presentational
//                    children OR a sibling View.
//   Container+View — this doc covers a container that has a sibling View
//                    co-located. The View is implicit; do not also write
//                    a separate doc for the bare View.
//   ViewStateHook  — `useXxxViewState`: UI-local state hook only.
// Sibling View: a `@<pkg>#<Symbol>` citation when Kind=Container and a
// View exists; otherwise `n/a`.
-->

## 2. Props

| Name | Type | Required | Default | Description |
| ---- | ---- | -------- | ------- | ----------- |

<!-- TEMPLATE-ONLY: row; min-rows: 0
Name: string; required; regex `^[a-z_][a-zA-Z0-9_]*$`
Type: string; required
Required: enum: yes | no
Default: string; default=
Description: string; required
-->

| label | string | yes | | Visible button label. |

<!-- TEMPLATE-ONLY: guide
// One row per prop. Empty table for props-less components (e.g. routes).
// Type is the TS type as written in the component's props interface.
-->

## 3. Events

<!-- TEMPLATE-ONLY: section; optional -->

| Name | Payload | Emitted when |
| ---- | ------- | ------------ |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Name: string; required; regex `^on[A-Z][A-Za-z0-9]*$`
Payload: string; required
Emitted when: string; required
-->

| onClick | () => void | User clicks the button. |

<!-- TEMPLATE-ONLY: guide
// Callbacks the component invokes upward. Name starts with `on` followed
// by an uppercase letter. Omit the section for components that emit no
// events.
-->

## 4. State

<!-- TEMPLATE-ONLY: section; optional -->

| Kind | Reference |
| ---- | --------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Kind: enum: ui-local | store | query | mutation | context
Reference: string; required
-->

| store | `@terv-dev/frontend#authStore` |

<!-- TEMPLATE-ONLY: guide
// External state the component reads or writes. `ui-local` covers
// `useState` / `useReducer` inside the component. View kind MUST have
// only `ui-local` entries; containers MAY have any kind. Omit the
// section for stateless leaves.
-->

## 5. Effects

<!-- TEMPLATE-ONLY: section; optional -->

| Trigger | Action | Cleanup |
| ------- | ------ | ------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Trigger: string; required
Action: string; required
Cleanup: string; default=
-->

| mount | subscribe to authStore | unsubscribe |

<!-- TEMPLATE-ONLY: guide
// `useEffect` blocks. Required when Kind=Container or Container+View and
// the component runs effects. View kind MUST NOT have an Effects
// section — Views are pure.
-->

## 6. Visual states

| State | Trigger | Visuals |
| ----- | ------- | ------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
State: string; required
Trigger: string; required
Visuals: string; required
-->

| default | initial render | filled primary background |

<!-- TEMPLATE-ONLY: guide
// Distinct render outputs the component produces. Include loading,
// empty, error, hover, focused, disabled, etc. where they apply.
-->

## 7. Children

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// What this component renders inside its JSX subtree. Cite child
// symbols by `@<pkg>#<Symbol>`. Mandatory when the component renders
// other components from this codebase; omit for leaves.
-->

## 8. Notes

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Rationale, gotchas, accessibility decisions, performance trade-offs.
-->
