<!-- TEMPLATE-ONLY: guide
// Short product name + release date, e.g. "Acme 2.4 — 2026-05-08".
-->

# Release Notes: <!-- TEMPLATE-ONLY: string; required -->

## 1. Metadata

<!-- TEMPLATE-ONLY: guide
// Use GA only after the release has shipped to all customers. A `guide` block
// placed between two bullets would split the list in two and drop the second
// bullet's directive, so keep it above the whole list.
-->

- Version: <!-- TEMPLATE-ONLY: string; regex `^\d+\.\d+\.\d+$`; required -->
- Stage: <!-- TEMPLATE-ONLY: enum: Alpha | Beta | GA; required -->

## 2. Highlights

<!-- TEMPLATE-ONLY: guide
// One concise sentence per bullet. Keep under 80 chars.
-->

- <!-- TEMPLATE-ONLY: string; required -->

## 3. Acceptance Criteria

| ID  | Description | Priority |
| --- | ----------- | -------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
// Each row describes one acceptance criterion.
ID: string; regex `^AC-\d+$`; required
Description: string; required
Priority: enum: Low | Medium | High; required
-->

| AC-001 | Sample criterion. | High |
