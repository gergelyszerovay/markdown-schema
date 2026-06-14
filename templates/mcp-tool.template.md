# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

<!-- TEMPLATE-ONLY: guide
// Title: the registered MCP tool name verbatim (snake_case, e.g.
// `find_declaration`). Summary: one sentence stating what the tool returns
// and for what caller.
-->

## 1. Identity

- Tool: <!-- TEMPLATE-ONLY: string; required; regex `^[a-z][a-z0-9_]*$` -->
- Server: <!-- TEMPLATE-ONLY: string; required; regex `^@[a-z0-9_-]+/[a-z0-9_.-]+$` -->
- Handler: <!-- TEMPLATE-ONLY: string; required; regex `^@[a-z0-9_-]+/[a-z0-9_.-]+#[a-zA-Z_$][\w$]*$` -->
- Category: <!-- TEMPLATE-ONLY: string; default= -->

<!-- TEMPLATE-ONLY: guide
// Tool: the name registered with `server.tool(...)`, snake_case. Server: the
// MCP server's package name (`package.json#name`). Handler: the
// `<package>#<Symbol>` of the function that implements the tool — the tool's
// own entry point (e.g. `getDeclaration` in `tools/get-declaration.ts`).
// Wrap it in backticks so the viewer renders it as a clickable symbol chip.
// (It is an internal symbol, so it may not resolve from the package entry
// until the server's manifest indexes internals.) Category: an optional
// grouping label matching the §registry (e.g. `discovery`, `declarations`).
-->

## 2. Input

| param | type | required | description |
| ----- | ---- | -------- | ----------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
param: string; required; regex `^([a-zA-Z_][a-zA-Z0-9_]*|\(none\))$`
type: string; required
required: enum: yes | no
description: string; required
-->

| package | string | yes | The package name to query. |

<!-- TEMPLATE-ONLY: guide
// One row per field of the tool's Zod input schema. Mirror the schema
// exactly — name, TS type, whether it is required (an `.optional()` field is
// `no`). A no-argument tool still needs one row: use a single `(none)` param
// with type `—` and required `no`.
-->

## 3. Output

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Describe the result shape. Prefer citing a `<package>#<Type>` when the
// handler returns a named type; otherwise give the literal TS shape in a
// fenced block. State what an empty / "nothing found" result looks like
// (e.g. `[]`), since callers branch on it.
-->

## 4. Behaviour

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// What the tool computes or resolves, and against what data (manifest, file
// system, graph). Note any disambiguation rules, ordering, or limits. Keep
// it to observable behaviour — implementation detail belongs in the code.
-->

## 5. Errors

<!-- TEMPLATE-ONLY: section; optional -->

| condition | result |
| --------- | ------ |

<!-- TEMPLATE-ONLY: row; min-rows: 1
condition: string; required
result: string; required
-->

| package not found | empty result |

<!-- TEMPLATE-ONLY: guide
// One row per failure or empty-result condition the caller must handle:
// the trigger and what the tool returns (an error object, an empty array,
// etc.). Omit the section only when the tool cannot fail or return empty.
-->

## 6. Example

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// A minimal call + response. Show the input arguments as a fenced ```json
// block and the returned value as another. Use a realistic package/symbol.
-->

## 7. Notes

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Irreducible prose: edge cases, relationship to sibling tools, gotchas
// (e.g. resolves only exported declarations, so `_shared/` symbols are
// invisible).
-->
