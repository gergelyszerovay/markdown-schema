# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

<!-- TEMPLATE-ONLY: guide
// Title: the feature name as it appears in `fractalTs.features` (e.g.
// "Auth", "Favorites", "Layout") — capitalised, human-readable.
// Summary: one sentence stating the user-facing capability.
-->

## 1. Source

- Package: <!-- TEMPLATE-ONLY: string; required; regex `^@[a-z0-9_-]+/[a-z0-9_.-]+$` -->
- Feature key: <!-- TEMPLATE-ONLY: string; required; regex `^[a-z][a-z0-9-]*$` -->

<!-- TEMPLATE-ONLY: guide
// Feature key is the lowercase identifier as it appears in the package's
// `fractalTs.features` map. Title is the display form of that same key.
-->

## 2. Exports

| Symbol                              | Kind  |
| ----------------------------------- | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Symbol: string; required; regex `^@[a-z0-9_-]+/[a-z0-9_.-]+#[A-Za-z_][A-Za-z0-9_]*$`
Kind: enum: View | Container | Store | Query | Hook | Type | Function | Const
-->

| `@scope/pkg#Symbol` | View  |

<!-- TEMPLATE-ONLY: guide
// Every public symbol the feature contributes — the same set that appears
// in the package's `fractalTs.features` array. Kind distinguishes the
// role at a glance. List exhaustively; the linter cross-checks against
// `package.json#fractalTs.features`.
-->

## 3. Routes

<!-- TEMPLATE-ONLY: section; optional -->

| Path | Tier | Auth |
| ---- | ---- | ---- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Path: string; required; regex `^[/A-Za-z0-9_:.*-]+$`
Tier: enum: public | member | tier1 | tier2 | tier3 | admin | any
Auth: enum: none | required | redirect-on-anon
-->

| /:tier/p/article/:slug | any | none |

<!-- TEMPLATE-ONLY: guide
// Routes owned by this feature. Omit the section for features that
// expose only components or stores, no routes.
-->

## 4. State

<!-- TEMPLATE-ONLY: section; optional -->

| Kind | Reference |
| ---- | --------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Kind: enum: store | query
Reference: string; required; regex `^(\.{1,2}/|/)[A-Za-z0-9_./-]+\.md$`
-->

| store | `./4.state/5.auth-store.zustand-store.md` |

<!-- TEMPLATE-ONLY: guide
// Stores and TanStack queries owned by this feature. Reference cells are
// plain-text paths to the matching template fills — same-tier targets use
// relative paths (`./` or `../`); cross-tier targets use repo-root
// absolute paths (leading `/`). Plain text rather than markdown link
// syntax because refines need to see the full URL, and `mdast-util-to-
// string` strips link markup from cells. Omit the section for stateless
// features.
-->

## 5. Data

<!-- TEMPLATE-ONLY: section; optional -->

| Kind | Reference |
| ---- | --------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Kind: enum: table | rpc | edge-function | external
Reference: string; required; regex `^(\.{1,2}/|/)[A-Za-z0-9_./-]+\.md$|^https?://.+$`
-->

| table | `/apps/terv-dev/layered-docs/2.data/3.tables/4.users.supabase-table.md` |

<!-- TEMPLATE-ONLY: guide
// Supabase or external data dependencies. Internal references are
// plain-text paths (relative for same-tier, repo-root absolute with a
// leading `/` for cross-tier). External references use `https://` URLs.
// Plain text rather than markdown link syntax because refines need URL
// visibility. Omit the section when the feature has no backend
// dependency.
-->

## 6. Flows

<!-- TEMPLATE-ONLY: section; optional -->

| Reference |
| --------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Reference: string; required; regex `^(\.{1,2}/|/)[A-Za-z0-9_./-]+\.md$`
-->

| `/apps/terv-dev/layered-docs/2.flows/3.toggle-favorite.business-flow.md` |

<!-- TEMPLATE-ONLY: guide
// Business flows that orchestrate this feature with others. Omit the
// section when no documented flow involves the feature.
-->

## 7. Dependencies

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Other features this one consumes (e.g. `favorites` needs `auth` for
// session, `content` for card data). Free-form bullets — the dependency
// graph is not validated automatically.
-->

## 8. Notes

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// History, gotchas, deferred decisions, links to issues.
-->
