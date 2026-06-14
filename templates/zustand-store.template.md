# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

<!-- TEMPLATE-ONLY: guide
// Title: the store symbol verbatim (e.g. `authStore`). Summary: one
// sentence stating what kind of state the store owns.
-->

## 1. Source

- Symbol: <!-- TEMPLATE-ONLY: string; required; regex `^@[a-z0-9_-]+/[a-z0-9_.-]+#[a-zA-Z_][A-Za-z0-9_]*Store$` -->
- Hook: <!-- TEMPLATE-ONLY: string; required; regex `^@[a-z0-9_-]+/[a-z0-9_.-]+#use[A-Z][A-Za-z0-9_]*Store$` -->
- Persistence: <!-- TEMPLATE-ONLY: enum: memory | localStorage | sessionStorage | cookie; required -->

<!-- TEMPLATE-ONLY: guide
// Symbol: the store instance (Zustand vanilla store).
// Hook: the React adapter (`useXxxStore(selector)`).
// Persistence: where state survives across reloads. Default `memory`.
-->

## 2. State

| Key | Type | Initial | Notes |
| --- | ---- | ------- | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Key: string; required; regex `^[a-z_][a-zA-Z0-9_]*$`
Type: string; required
Initial: string; required
Notes: string; default=
-->

| session | Session | null | Supabase auth session or null |

<!-- TEMPLATE-ONLY: guide
// One row per top-level state key. Type is the TS type. Initial is the
// literal default value as TS source. Empty key list is not valid — a
// store with no state has no reason to exist.
-->

## 3. Actions

| Name | Signature | Mutates | Notes |
| ---- | --------- | ------- | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Name: string; required; regex `^[a-z][a-zA-Z0-9_]*$`
Signature: string; required
Mutates: string; required
Notes: string; default=
-->

| setSession | (s: Session \| null) => void | session, initialized | also sets `initialized: true` |

<!-- TEMPLATE-ONLY: guide
// Synchronous mutators only. Async logic belongs in hooks/services that
// call into the store; the action itself is a pure `set(...)` call. The
// Mutates column lists state keys touched, comma-separated. Refine
// verifies every name in Mutates appears in §2.
-->

## 4. Selectors

<!-- TEMPLATE-ONLY: section; optional -->

| Name | Projects |
| ---- | -------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Name: string; required
Projects: string; required
-->

| useSession | `state.session` |

<!-- TEMPLATE-ONLY: guide
// Exported convenience hooks that pre-select common slices. Omit the
// section when consumers call `useXxxStore(selector)` directly.
-->

## 5. Subscribers

<!-- TEMPLATE-ONLY: section; optional -->

| Symbol | Behavior |
| ------ | -------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Symbol: string; required; regex `^@[a-z0-9_-]+/[a-z0-9_.-]+#[A-Za-z_][A-Za-z0-9_.]*$`
Behavior: string; required
-->

| `@terv-dev/frontend#initAuth` | calls `setSession` on auth-change events |

<!-- TEMPLATE-ONLY: guide
// Non-React consumers — router loaders, init code, analytics. React
// components that consume via the hook do not appear here.
-->

## 6. Cross-store dependencies

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// State this store reads from or writes to other stores during an action.
// Cross-store coupling is a smell; document the rationale.
-->

## 7. Reset rules

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// When state is cleared back to initial — e.g. sign-out, app boot, route
// change. "Never" is a valid value.
-->

## 8. Notes

<!-- TEMPLATE-ONLY: freetext; required -->
