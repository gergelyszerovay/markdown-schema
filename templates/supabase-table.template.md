# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

<!-- TEMPLATE-ONLY: guide
// Title: the table name verbatim (e.g. `user_favorites`). Summary: one
// sentence stating what each row represents.
-->

## 1. Identity

- Schema: <!-- TEMPLATE-ONLY: string; required; regex `^[a-z][a-z0-9_]*$` -->
- Table: <!-- TEMPLATE-ONLY: string; required; regex `^[a-z][a-z0-9_]*$` -->
- Primary key: <!-- TEMPLATE-ONLY: string; required -->

<!-- TEMPLATE-ONLY: guide
// Schema/Table use lowercase snake_case Postgres identifiers. Primary key
// names the column(s), e.g. `id` or `(user_id, slug, page_type)`.
-->

## 2. Columns

| Name | Type | Nullable | Default | Notes |
| ---- | ---- | -------- | ------- | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Name: string; required; regex `^[a-z][a-z0-9_]*$`
Type: string; required
Nullable: enum: yes | no
Default: string; default=
Notes: string; default=
-->

| id | uuid | no | gen_random_uuid() | PK |

<!-- TEMPLATE-ONLY: guide
// One row per column. Type is the Postgres type (`uuid`, `text`,
// `timestamptz`, `numeric(10,4)`, `jsonb`). Default empty for none.
-->

## 3. Constraints

<!-- TEMPLATE-ONLY: section; optional -->

| Kind | Definition |
| ---- | ---------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Kind: enum: unique | check | foreign-key | exclusion
Definition: string; required
-->

| unique | (user_id, slug, page_type) |

<!-- TEMPLATE-ONLY: guide
// Table-level constraints beyond the PK. Definition is the SQL fragment
// or column tuple. Foreign keys list the target plus cascade rules.
-->

## 4. Indexes

<!-- TEMPLATE-ONLY: section; optional -->

| Name | Columns | Notes |
| ---- | ------- | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Name: string; required; regex `^[a-z][a-z0-9_]*$`
Columns: string; required
Notes: string; default=
-->

| idx_user_favorites_user_created | (user_id, created_at desc) | Backs ordered list query. |

## 5. RLS

| Operation | Role | Using / With check |
| --------- | ---- | ------------------ |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Operation: enum: SELECT | INSERT | UPDATE | DELETE | ALL
Role: enum: anon | authenticated | service_role | postgres | public
Using / With check: string; required
-->

| SELECT | authenticated | `auth.uid() = user_id` |

<!-- TEMPLATE-ONLY: guide
// One row per RLS policy on the table. RLS is required even if every
// policy is `service_role`-only; use ALL for the implied catch-all in
// that case. `Using / With check` carries the policy predicate. If no
// policy exists the table MUST NOT be exposed via PostgREST.
-->

## 6. Triggers

<!-- TEMPLATE-ONLY: section; optional -->

| Name | Timing | Action |
| ---- | ------ | ------ |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Name: string; required; regex `^[a-z][a-z0-9_]*$`
Timing: enum: BEFORE INSERT | AFTER INSERT | BEFORE UPDATE | AFTER UPDATE | BEFORE DELETE | AFTER DELETE
Action: string; required
-->

| set_updated_at | BEFORE UPDATE | calls `public.set_updated_at()` |

## 7. Consumers

| Symbol | Role |
| ------ | ---- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Symbol: string; required; regex `^@[a-z0-9_-]+/[a-z0-9_.-]+#[A-Za-z_][A-Za-z0-9_.]*$`
Role: string; required
-->

| `@terv-dev/frontend#favoritesKeys` | client read via PostgREST embed |

<!-- TEMPLATE-ONLY: guide
// Workspace symbols that read or write the table. RPC functions are
// captured separately in supabase-rpc docs and may reference the table
// from there; this list focuses on application code.
-->

## 8. Notes

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Migration history, performance characteristics, retention policy,
// known issues.
-->
