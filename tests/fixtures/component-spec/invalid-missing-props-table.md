# Component Spec: Badge

## 1. Summary

A badge component with no props table, which should fail validation.

## 2. Classification

- Type: View
- Scope: Shared
- Parent Component: n/a
- Repetition: Single

## 3. Responsibilities

### 3.1 MUST

- Render the badge.

### 3.2 SHOULD

- Support colour variants.

### 3.3 MUST NOT

- Manage state.

## 4. Inputs (Props)

No props defined.

## 6. Outputs (Events)

| Event Name | Payload Type | Description   | Emitted When |
| ---------- | ------------ | ------------- | ------------ |
| onClick    | () => void   | User clicked. | Click.       |

## 8. Visual States

### 8.1 Default

- Description: Normal state.
- Visuals: Badge at full opacity.
