# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

<!-- TEMPLATE-ONLY: guide
// Title: the key-catalogue symbol short name (e.g. `favoritesKeys`).
// Summary: one sentence stating the server resource the cache mirrors.
-->

## 1. Source

- Key catalogue: <!-- TEMPLATE-ONLY: string; required; regex `^@[a-z0-9_-]+/[a-z0-9_.-]+#[a-z][A-Za-z0-9_]*Keys$` -->

<!-- TEMPLATE-ONLY: guide
// The exported keys object (e.g. `favoritesKeys = { all, list, ... }`).
// One doc per key-catalogue symbol; sub-keys and hooks are grouped here.
-->

## 2. Keys

| Key | Factory | Returns |
| --- | ------- | ------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Key: string; required; regex `^[a-z][a-zA-Z0-9_]*$`
Factory: string; required
Returns: string; required
-->

| all | `() => readonly ["favorites"]` | namespace root |

<!-- TEMPLATE-ONLY: guide
// Every entry in the key catalogue. Factory shows the call signature.
// Returns shows the produced key tuple shape.
-->

## 3. Queries

<!-- TEMPLATE-ONLY: section; optional -->

| Hook | Key | queryFn | Enabled | staleTime |
| ---- | --- | ------- | ------- | --------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Hook: string; required; regex `^@[a-z0-9_-]+/[a-z0-9_.-]+#use[A-Z][A-Za-z0-9_]*$`
Key: string; required
queryFn: string; required
Enabled: string; required
staleTime: string; required
-->

| `@terv-dev/frontend#useFavoritesList` | `favoritesKeys.list()` | fetchFavoritesList | `!!session` | Infinity |

<!-- TEMPLATE-ONLY: guide
// One row per `useQuery` hook in this namespace. Empty section is
// acceptable for mutation-only namespaces.
-->

## 4. Mutations

<!-- TEMPLATE-ONLY: section; optional -->

| Hook | mutationFn | Optimistic | Invalidates onSettled |
| ---- | ---------- | ---------- | --------------------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Hook: string; required; regex `^@[a-z0-9_-]+/[a-z0-9_.-]+#use[A-Z][A-Za-z0-9_]*$`
mutationFn: string; required
Optimistic: enum: yes | no
Invalidates onSettled: string; required
-->

| `@terv-dev/frontend#useToggleFavorite` | INSERT or DELETE on user_favorites | yes | `favoritesKeys.list()` |

<!-- TEMPLATE-ONLY: guide
// One row per mutation. Optimistic=yes means the cache is patched
// before the mutation resolves; Invalidates names the key(s) cleared in
// `onSettled` so the next read refetches.
-->

## 5. Prefetch points

<!-- TEMPLATE-ONLY: section; optional -->

| Symbol | When |
| ------ | ---- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Symbol: string; required; regex `^@[a-z0-9_-]+/[a-z0-9_.-]+#[A-Za-z_][A-Za-z0-9_.]*$`
When: string; required
-->

| `@terv-dev/frontend#prefetchFavorites` | called from initAuth on session set |

<!-- TEMPLATE-ONLY: guide
// Non-React callers that warm the cache. Each prefetch must use the same
// queryFn + staleTime as the matching query in §3.
-->

## 6. Cache lifecycle

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// When entries are removed (sign-out, route change, manual reset).
// "Per query staleTime; no manual removal" is a valid answer.
-->

## 7. Server source

| Kind | Reference |
| ---- | --------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Kind: enum: table | rpc | edge-function | rest | external
Reference: string; required
-->

| table | `public.user_favorites` |

<!-- TEMPLATE-ONLY: guide
// Backing DB tables, RPCs, edge functions, or external APIs. Used by the
// linter to cross-link query docs with data-layer specs.
-->

## 8. Notes

<!-- TEMPLATE-ONLY: freetext; required -->
