# Component Spec: Input

## 1. Summary

A thin wrapper around the shadcn Input primitive that provides controlled
text input with an optional helper message and error state.

## 2. Classification

- Type: Primitive
- Scope: Shared
- Parent Component: n/a
- Repetition: Single
- Source: shadcn

## 3. Responsibilities

### 3.1 MUST

- Render the underlying shadcn Input element with all forwarded props.
- Display the error message when `error` is provided.

### 3.2 SHOULD

- Forward a `ref` to the underlying input element.

### 3.3 MUST NOT

- Perform validation logic; that belongs in the form controller.

## 4. Inputs (Props)

| Prop Name | Type   | Default | Description                            | Required |
| --------- | ------ | ------- | -------------------------------------- | -------- |
| value     | string | —       | Controlled input value.                | Yes      |
| error     | string | —       | Error message shown beneath the input. | No       |

## 6. Outputs (Events)

| Event Name | Payload Type            | Description              | Emitted When                     |
| ---------- | ----------------------- | ------------------------ | -------------------------------- |
| onChange   | (value: string) => void | Reports new input value. | User types into the input field. |

## 8. Visual States

### 8.1 Default

- Description: Field is empty or has a value with no validation error.
- Visuals: Standard border colour; placeholder text visible when empty.

### 8.2 Error

- Description: `error` prop is a non-empty string.
- Visuals: Border turns red; error message appears below in red text.
