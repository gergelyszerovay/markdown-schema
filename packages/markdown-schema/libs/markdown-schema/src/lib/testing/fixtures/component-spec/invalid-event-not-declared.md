# Component Spec: Toggle

## 1. Summary

A toggle switch that references an undeclared event in its visual states.

## 2. Classification

- Type: View
- Scope: Shared
- Parent Component: n/a
- Repetition: Single

## 3. Responsibilities

### 3.1 MUST

- Render a toggle switch.

### 3.2 SHOULD

- Animate the transition.

### 3.3 MUST NOT

- Manage form submission.

## 4. Inputs (Props)

| Prop Name | Type    | Default | Description               | Required |
| --------- | ------- | ------- | ------------------------- | -------- |
| checked   | boolean | false   | Whether the toggle is on. | No       |

## 6. Outputs (Events)

| Event Name | Payload Type               | Description                | Emitted When             |
| ---------- | -------------------------- | -------------------------- | ------------------------ |
| onChange   | (checked: boolean) => void | Reports new checked state. | User toggles the switch. |

## 8. Visual States

### 8.1 Off

- Description: Toggle is unchecked.
- Visuals: Thumb on the left; fires `onToggle` when clicked.

### 8.2 On

- Description: Toggle is checked.
- Visuals: Thumb on the right; background turns accent colour.
