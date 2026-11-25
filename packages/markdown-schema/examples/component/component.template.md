# Component Spec: <!-- TEMPLATE-ONLY: string; required -->

<!-- TEMPLATE-ONLY: guide
// Every event name referenced in a Visual State's Visuals line must be declared in Outputs
-->

<!-- TEMPLATE-ONLY: guide
// Single-paragraph prose describing the component's primary responsibility
// (what it does, not how it does it). Keep to 1–3 sentences.
-->

## 1. Summary

<!-- TEMPLATE-ONLY: freetext; required -->

## 2. Classification

<!-- TEMPLATE-ONLY: guide
// Fill Source (where a third-party primitive comes from, e.g. shadcn) only
// when Type is Primitive; leave it out otherwise.
-->

- Type: <!-- TEMPLATE-ONLY: enum: Root | Layout | Container | View | Provider | Primitive; required -->
- Scope: <!-- TEMPLATE-ONLY: enum: Feature | Shared; required -->
- Parent Component: <!-- TEMPLATE-ONLY: string; required -->
- Repetition: <!-- TEMPLATE-ONLY: enum: Single | Repeated | Conditional | Conditional + Repeated; required -->
- Source: <!-- TEMPLATE-ONLY: string; optional; only-if Type=Primitive -->

## 3. Responsibilities

<!-- TEMPLATE-ONLY: guide
// Add at least one bullet per sub-section. Use MUST/SHOULD/MUST NOT only for
// enforceable requirements, not general guidance.
-->

### 3.1 MUST

<!-- TEMPLATE-ONLY: guide
// Required, testable responsibilities, one per bullet.
-->

- <!-- TEMPLATE-ONLY: string; required -->

### 3.2 SHOULD

<!-- TEMPLATE-ONLY: guide
// Recommended but non-critical responsibilities.
-->

- <!-- TEMPLATE-ONLY: string; required -->

### 3.3 MUST NOT

<!-- TEMPLATE-ONLY: guide
// Explicit anti-responsibilities (boundary clarity).
-->

- <!-- TEMPLATE-ONLY: string; required -->

## 4. Inputs (Props)

| Prop Name | Type | Default | Description | Required |
| --------- | ---- | ------- | ----------- | -------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Prop Name: string; regex `^[a-z][a-zA-Z0-9]*$`; required
Type: string; required
Default: string; default=—
Description: string; required
Required: enum: Yes | No; required
-->

| propName | string | — | Short functional description. | Yes |

## 5. Slots / Content Projection

<!-- TEMPLATE-ONLY: section; optional -->

| Slot Name | Description | Required | Default Content |
| --------- | ----------- | -------- | --------------- |

<!-- TEMPLATE-ONLY: row
Slot Name: string; required
Description: string; required
Required: enum: Yes | No; required
Default Content: string; default=none
-->

| slotName | Content region description. | No | none |

## 6. Outputs (Events)

<!-- TEMPLATE-ONLY: guide
// Use onXxx camelCase naming (e.g. onClick, onSelect).
// Event names must start with "on" followed by a capital letter.
-->

| Event Name | Payload Type | Description | Emitted When |
| ---------- | ------------ | ----------- | ------------ |

<!-- TEMPLATE-ONLY: row
Event Name: string; regex `^on[A-Z][a-zA-Z0-9]*$`; required
Payload Type: string; required
Description: string; required
Emitted When: string; required
-->

| onEventName | () => void | What this event signals. | User action that triggers it. |

## 7. Internal State

<!-- TEMPLATE-ONLY: guide
// View components have no internal state: leave this section out when Type is View.
-->

<!-- TEMPLATE-ONLY: section; optional; remove-if Type=View -->

| State Key | Purpose | Source | Notes |
| --------- | ------- | ------ | ----- |

<!-- TEMPLATE-ONLY: row
State Key: string; required
Purpose: string; required
Source: string; default=
Notes: string; default=
-->

| stateKey | State purpose. | source | Notes. |

## 8. Visual States

<!-- TEMPLATE-ONLY: guide
// One H3 per visual state, numbered from 8.1 (e.g. "8.1 Default", "8.2 Hover"),
// each with a Description and a Visuals line.
-->

<!-- TEMPLATE-ONLY: section; min-groups: 1 -->

### <!-- TEMPLATE-ONLY: string; regex `^8\.\d+ .+$`; required -->

- Description: <!-- TEMPLATE-ONLY: string; required -->
- Visuals: <!-- TEMPLATE-ONLY: string; required -->
