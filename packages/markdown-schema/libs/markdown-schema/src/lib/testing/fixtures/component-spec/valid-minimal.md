# Component Spec: Badge

## 1. Summary

A small inline label that renders a coloured badge with a short text string.

## 2. Classification

- Type: View
- Scope: Shared
- Parent Component: n/a
- Repetition: Repeated

## 3. Responsibilities

### 3.1 MUST

- Render the label text inside a styled badge element.

### 3.2 SHOULD

- Accept a colour variant prop.

### 3.3 MUST NOT

- Manage any application state.

## 4. Inputs (Props)

| Prop Name | Type   | Default | Description                      | Required |
| --------- | ------ | ------- | -------------------------------- | -------- |
| label     | string | —       | Text displayed inside the badge. | Yes      |

## 6. Outputs (Events)

| Event Name | Payload Type | Description                    | Emitted When           |
| ---------- | ------------ | ------------------------------ | ---------------------- |
| onClick    | () => void   | Signals user tap on the badge. | User clicks the badge. |

## 8. Visual States

### 8.1 Default

- Description: Normal resting state.
- Visuals: Filled background with label text at full opacity.
