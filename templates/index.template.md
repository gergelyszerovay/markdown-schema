# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

<!-- TEMPLATE-ONLY: guide
// One-line summary. Single sentence, 10-200 chars, no line breaks.
// Used by parent indexes and by LLM context summaries.
-->

## Key Points

<!-- TEMPLATE-ONLY: guide
// 2-4 prose bullets. Each is a single sentence capturing something a reader
// MUST know before drilling deeper. No links inside Key Points.
// Bullet count + link-absence enforced by refine.
-->

- First bullet placeholder.
- Second bullet placeholder.

## Contents

| Topic | File | Summary |
| ----- | ---- | ------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Topic: string; required; regex `^[A-Z][A-Za-z0-9 +/&-]*$`
File: string; required; regex `^[A-Za-z0-9_./-]+\.md$`
Summary: string; required; regex `^[^\n]{5,160}$`
-->

| Topic name | [filename](./filename.md) | Short summary, max 160 chars. |

<!-- TEMPLATE-ONLY: guide
// One row per direct child file or subdirectory. Subdirectories link to
// their <n+1>.index.md.
// The File column MUST be a relative Markdown link, prefixed with ./ or ../.
// External / cross-domain links go in the Cross-Domain section below.
// Tree-linter rule L1 enforces that every sibling file/subdir appears here.
// A short trailing paragraph after the table is permitted (e.g. "more domains
// will be added"), but keep it minimal — most context belongs in child docs.
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

| Topic | [name](../other-domain/1.index.md) | domain |

<!-- TEMPLATE-ONLY: guide
// Optional. Include this section only when at least one cross-domain link
// exists. Empty sections are forbidden by linter rule L10.5.
// Per cross-references.spec, links SHOULD target an index file at the
// other domain (not deep content).
// Domains column lists comma-separated kebab-case domain names.
-->
