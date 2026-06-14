# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

<!-- TEMPLATE-ONLY: guide
// Specialized index for the `4.tools/` directory of an MCP server. Title:
// "MCP tools" (kept consistent across servers). Summary: one sentence
// stating that this is the registry of tools the server exposes.
-->

## Key Points

<!-- TEMPLATE-ONLY: guide
// 2-4 prose bullets. Each captures something a reader MUST know before
// drilling into per-tool docs (e.g. tool-name casing, what the tools query,
// which tools are gated by a server option).
-->

- First bullet placeholder.
- Second bullet placeholder.

## Contents

| Topic | File | Summary |
| ----- | ---- | ------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Topic: string; required; regex `^[A-Za-z][A-Za-z0-9 +/&_-]*$`
File: string; required; regex `^[A-Za-z0-9_./-]+\.md$`
Summary: string; required; regex `^[^\n]{5,160}$`
-->

| find_declaration | `5.find-declaration.mcp-tool.md` | Resolve a declaration name to manifest keys. |

<!-- TEMPLATE-ONLY: guide
// Standard `## Contents` nav table: one row per per-tool spec sibling.
// Required by the index-shape rules in linter L10.
-->

## Registry

| tool | category | input | output | spec |
| ---- | -------- | ----- | ------ | ---- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
tool: string; required; regex `^[a-z][a-z0-9_]*$`
category: string; required; regex `^[a-z][a-z0-9-]*$`
input: string; required
output: string; required
spec: string; required; regex `^[A-Za-z0-9_./-]+\.mcp-tool\.md$`
-->

| find_declaration | declarations | `{ package, name, filePath? }` | `string[]` | `5.find-declaration.mcp-tool.md` |

<!-- TEMPLATE-ONLY: guide
// One row per tool registered with `server.tool(...)`. The linter
// cross-checks that:
//   - every row has a matching per-tool fill in this directory;
//   - every per-tool fill appears as a row;
//   - each `spec` file's Identity.Tool equals this row's `tool`.
// `input` is a compact shape (the field list); `output` the result type or
// shape. `category` groups tools for navigation.
-->

## Cross-Domain

<!-- TEMPLATE-ONLY: section; optional -->

| Topic | File | Domains |
| ----- | ---- | ------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Topic: string; required
File: string; required; regex `^[A-Za-z0-9_./-]+\.md$`
Domains: string; required; regex `^[a-z][a-z0-9-]*(,\s*[a-z][a-z0-9-]*)*$`
-->

| Symbol references | `/apps/terv-dev/layered-docs/2.spec-system/3.symbol-references.spec.md` | spec-system |

## Notes

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Optional commentary on the tool set as a whole — categories, option-gated
// tools, transport notes. Required section, but "None." is acceptable.
-->
