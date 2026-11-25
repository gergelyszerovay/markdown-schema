# Component Spec:

## 1. Summary

A component spec with no name after the colon, which should fail title validation.

## 2. Classification

- Type: View
- Scope: Shared
- Parent Component: n/a
- Repetition: Single

## 3. Responsibilities

### 3.1 MUST

- Render a button.

### 3.2 SHOULD

- Look good.

### 3.3 MUST NOT

- Break things.

## 4. Inputs (Props)

| Prop Name | Type   | Default | Description  | Required |
| --------- | ------ | ------- | ------------ | -------- |
| label     | string | —       | Button text. | Yes      |

## 6. Outputs (Events)

| Event Name | Payload Type | Description   | Emitted When |
| ---------- | ------------ | ------------- | ------------ |
| onClick    | () => void   | User clicked. | Click event. |

## 8. Visual States

### 8.1 Default

- Description: Normal state.
- Visuals: Rendered button at full opacity.
