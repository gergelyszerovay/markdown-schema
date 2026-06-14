# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

<!-- TEMPLATE-ONLY: guide
// Specialized index for a design-system directory: the registry of per-theme
// DESIGN.md token files. Title: the design system's name (e.g. "Design
// system"). Summary: one sentence stating that this aggregates the theme token
// files. Binds the spec-viz `design-system-registry` aggregate view, which
// fetches each `## Contents` row's `*.design.md` file and renders the themes
// side-by-side.
-->

## Key Points

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// 2-6 prose bullets. Each captures something a reader MUST know before drilling
// into the per-theme files (e.g. which file is the build source of truth, how
// frontmatter maps to CSS vars, which themes exist).
-->

## Contents

| Theme | File | Summary |
| ----- | ---- | ------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Theme: string; required; regex `^[A-Za-z][A-Za-z0-9 +/&_-]*$`
File: string; required; regex `^[A-Za-z0-9_./-]+\.md$`
Summary: string; required; regex `^[^\n]{5,160}$`
-->

| Light | `2.light.design.md` | The default theme's tokens and rationale. |

<!-- TEMPLATE-ONLY: guide
// Standard `## Contents` nav table: one row per per-theme `*.design.md`
// sibling. The `File` cell is a relative markdown link whose text is the
// filename; the aggregate view resolves each link and fetches the theme's
// frontmatter tokens. Required by the index-shape rules in linter L10.
-->

## Validation

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// How the per-theme files are validated (the `validate-md` invocation and the
// `design.template.md` + `design.refine.ts` pair that enforces the token
// rules). "None." is acceptable if validation is documented elsewhere.
-->

## Cross-Domain

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Optional table or prose linking related domains (generated theme CSS, the
// consuming frontend package, legacy token systems). Free-text so link cells
// may carry annotations.
-->
