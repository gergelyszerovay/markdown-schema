# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

<!-- TEMPLATE-ONLY: guide
// Title: the function name verbatim, e.g. `public.deduct_api_cost`. The
// summary captures the function's purpose in one sentence.
-->

## 1. Identity

- Schema: <!-- TEMPLATE-ONLY: string; required; regex `^[a-z][a-z0-9_]*$` -->
- Function: <!-- TEMPLATE-ONLY: string; required; regex `^[a-z][a-z0-9_]*$` -->
- Returns: <!-- TEMPLATE-ONLY: string; required -->
- Security: <!-- TEMPLATE-ONLY: enum: definer | invoker; required -->
- Volatility: <!-- TEMPLATE-ONLY: enum: immutable | stable | volatile; required -->

## 2. Parameters

| Name | Type | Default | Notes |
| ---- | ---- | ------- | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 0
Name: string; required; regex `^[a-z_][a-z0-9_]*$`
Type: string; required
Default: string; default=
Notes: string; default=
-->

| p_user_id | uuid |  | required |

<!-- TEMPLATE-ONLY: guide
// Empty table for parameter-less functions. Name uses snake_case with
// optional `p_` / `in_` prefix per Postgres convention.
-->

## 3. Behavior

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Numbered or bulleted description of what the function does. Highlight
// locking (`FOR UPDATE`, advisory locks), atomicity guarantees, side
// effects on other tables, and any transaction-boundary concerns.
-->

## 4. Error codes

<!-- TEMPLATE-ONLY: section; optional -->

| Code | Trigger |
| ---- | ------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Code: string; required; regex `^[a-z][a-z0-9_]*$`
Trigger: string; required
-->

| insufficient_budget | Period spent + topup balance covers less than `p_cost`. |

<!-- TEMPLATE-ONLY: guide
// Application-level error strings the function returns (e.g. via JSONB
// `{"error": "..."}`), not Postgres SQLSTATE codes. Omit the section if
// the function cannot fail outside of standard Postgres errors.
-->

## 5. RLS interaction

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// How the function interacts with RLS — typically `SECURITY DEFINER`
// bypasses RLS on internal queries. State which tables it touches and
// why bypass (or not) is correct. Required when Security=definer.
-->

## 6. Callers

| Caller | Context |
| ------ | ------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Caller: string; required
Context: string; required
-->

| `llm-proxy` edge function | per-request, post-OpenRouter, inside transaction |

<!-- TEMPLATE-ONLY: guide
// Edge functions, application code, cron jobs, and other Postgres
// functions that invoke this RPC. Caller cell may be a workspace
// symbol (`@scope/pkg#fn`) or a non-symbol caller (edge function
// name, cron job name).
-->

## 7. Tables touched

<!-- TEMPLATE-ONLY: section; optional -->

| Action | Table |
| ------ | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Action: enum: SELECT | INSERT | UPDATE | DELETE | LOCK
Table: string; required; regex `^([a-z][a-z0-9_]*\.)?[a-z][a-z0-9_]*$`
-->

| SELECT FOR UPDATE | public.user_api_budget |

<!-- TEMPLATE-ONLY: guide
// One row per table the function reads or writes. The `LOCK` action
// covers `SELECT ... FOR UPDATE` and explicit `LOCK TABLE` statements.
-->

## 8. Notes

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Migration history, performance characteristics, edge cases, known
// failure modes.
-->
