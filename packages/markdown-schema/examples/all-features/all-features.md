# All-Features Showcase: Order Form 2026 Q2

> The order form of Acme Industries for the second quarter of 2026.

## 1. Inline: Required Fields

- Name: Acme Industries
- SKU: ACM-1234

## 2. Inline: Optional Fields

- Nickname: Acme
- Tier: Pro

## 3. Inline: Enums

- Stage: GA
- Priority: High

## 4. Inline: Enum Values With Escaped Pipes

- Logical Op: A | B (either)

## 5. Inline: Conditional Field (`only-if`)

- Plan Type: Paid
- Card Last 4: 4242

## 6. Inline: Default Value

- Currency: EUR

## 7. Inline: H3 Directive in a Repeated Section

### add: loadPlugin()

- Adds an async entry point for plugin discovery.
- Supports lazy module resolution from a registry.

### fix: race in cache eviction

- Resolves a deadlock when two writers contend for the same key.
- Adds a regression test covering concurrent eviction.

## 8. Block: Table with `row` Directive

| Prop Name | Type   | Required | Description                          |
| --------- | ------ | -------- | ------------------------------------ |
| label     | string | Yes      | Visible text rendered on the button. |
| disabled  | string | No       | When "true", suppresses onClick.     |

## 9. Block: `section` Directive

- Notes: Renew before 2026-12-31.

## 10. Block: Free-Text Section

A free-form description paragraph.

```ts
const example = "code block preserved";
```

- bullet one
- bullet two

> A blockquote.

---

### Sub-heading inside free-text

More content under an H3.

## 11. Block: Keyed Table with a Checkbox Column

| ID  | Task                     | Done |
| --- | ------------------------ | ---- |
| T-1 | Confirm the delivery.    | [x]  |
| T-2 | Send the signed invoice. | [ ]  |

## 12. Block: Task List with Item Rules

- [x] Collect the purchase order
- [ ] Schedule the kickoff call
