# Checklist: <!-- TEMPLATE-ONLY: string; regex `^[a-z][a-z-]*$`; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

<!-- TEMPLATE-ONLY: document; open -->

## Identity

- Owner: <!-- TEMPLATE-ONLY: string; required -->
- Stage: <!-- TEMPLATE-ONLY: enum: draft | live; required -->
- Note: <!-- TEMPLATE-ONLY: string; optional -->

## Steps

<!-- TEMPLATE-ONLY: section; min-items: 1; max-items: 5; regex `^[A-Z]` -->

- [ ] Do the first thing

## Checks

| ID  | Check | Done | Owner |
| --- | ----- | ---- | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; key; regex `^C[1-9][0-9]*$`
Check: string; required
Done: checkbox
Owner: string; optional; default=nobody
-->

| C1 | Look at it | [ ] | someone |

## Links

<!-- TEMPLATE-ONLY: section; optional -->

- a plain item

## Changes

<!-- TEMPLATE-ONLY: section; min-groups: 1 -->

### <!-- TEMPLATE-ONLY: string; regex `^(add|fix): .+$`; required -->

- one item

## Table without rules

| Name | Value |
| ---- | ----- |
| a    | b     |

## Notes

<!-- TEMPLATE-ONLY: freetext; optional -->

Prose.
