# Component Spec: Spacer

## 1. Summary

A layout spacer that provides visual separation between elements.

## 2. Classification

- Type: View
- Scope: Shared
- Parent Component: n/a
- Repetition: Repeated

## 3. Responsibilities

### 3.1 MUST

- Render an invisible spacing element.

### 3.2 SHOULD

- Accept a size prop.

### 3.3 MUST NOT

- Render any visible content.

## 4. Inputs (Props)

| Prop Name | Type   | Default | Description        | Required |
| --------- | ------ | ------- | ------------------ | -------- |
| size      | number | 8       | Spacing in pixels. | No       |

## 6. Outputs (Events)

| Event Name | Payload Type | Description   | Emitted When |
| ---------- | ------------ | ------------- | ------------ |
| onClick    | () => void   | User clicked. | Click.       |

## 8. Visual States
