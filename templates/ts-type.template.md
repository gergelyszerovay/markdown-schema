# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

<!-- TEMPLATE-ONLY: guide
// Title: the exported symbol name, verbatim — e.g. "Page", "PromptManifest".
// Summary: one sentence stating what the type represents in domain terms,
// not its TypeScript shape.
-->

## 1. Source

- Package: <!-- TEMPLATE-ONLY: string; required; regex `^@[a-z0-9_-]+/[a-z0-9_.-]+$` -->
- Export: <!-- TEMPLATE-ONLY: string; required; regex `^[A-Za-z_][A-Za-z0-9_]*$` -->
- Kind: <!-- TEMPLATE-ONLY: enum: type | interface | enum | discriminated-union | zod-schema | const; required -->

<!-- TEMPLATE-ONLY: guide
// File path is deliberately omitted — `destiny` moves files. The pair
// (Package, Export) is the stable contract per symbol-references.spec.
-->

## 2. Related symbols

| Symbol                         | Relation                       |
| ------------------------------ | ------------------------------ |

<!-- TEMPLATE-ONLY: row; min-rows: 0
Symbol: string; required; regex `^@[a-z0-9_-]+/[a-z0-9_.-]+#[A-Za-z_][A-Za-z0-9_.]*$`
Relation: string; required
-->

| `@scope/pkg#Symbol` | Short relation description.    |

<!-- TEMPLATE-ONLY: guide
// Other symbols this type closely couples with — paired Zod schema,
// nested union members, factory functions returning this type, etc.
// Use the canonical `@scope/pkg#Symbol` form. Empty table is valid for
// standalone types.
-->

## 3. Consumers

| Symbol                         | Role                           |
| ------------------------------ | ------------------------------ |

<!-- TEMPLATE-ONLY: row; min-rows: 0
Symbol: string; required; regex `^@[a-z0-9_-]+/[a-z0-9_.-]+#[A-Za-z_][A-Za-z0-9_.]*$`
Role: string; required
-->

| `@scope/pkg#Consumer` | reads / writes / validates    |

<!-- TEMPLATE-ONLY: guide
// Symbols that depend on this type. List the import-graph leaves that
// are interesting to document, not every transitive consumer. Use the
// canonical `@scope/pkg#Symbol` form.
-->

## 4. JSON shape

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// If the type is serialized over the wire or to JSON files, show its JSON
// representation here as a fenced ```json block. Omit this section
// entirely for purely in-memory types.
-->

## 5. Invariants

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Runtime constraints not expressible in TS or Zod — cross-field rules,
// referential integrity, business semantics. Bullet list. Omit the
// section when there are no such constraints.
-->

## 6. Notes

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Free-form prose: rationale, history, gotchas, planned changes. Required
// section but content may be terse.
-->
