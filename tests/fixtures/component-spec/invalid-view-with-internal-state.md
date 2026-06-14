# Component Spec: Counter

## 1. Summary

A counter component that is incorrectly typed as View while having internal state.

## 2. Classification

- Type: View
- Scope: Feature
- Parent Component: n/a
- Repetition: Single

## 3. Responsibilities

### 3.1 MUST

- Display the current count.

### 3.2 SHOULD

- Animate count changes.

### 3.3 MUST NOT

- Manage navigation.

## 4. Inputs (Props)

| Prop Name    | Type   | Default | Description           | Required |
| ------------ | ------ | ------- | --------------------- | -------- |
| initialCount | number | 0       | Starting count value. | No       |

## 6. Outputs (Events)

| Event Name | Payload Type            | Description            | Emitted When   |
| ---------- | ----------------------- | ---------------------- | -------------- |
| onChange   | (count: number) => void | Reports current count. | Count changes. |

## 7. Internal State

| State Key | Purpose                         | Source | Notes                          |
| --------- | ------------------------------- | ------ | ------------------------------ |
| count     | Tracks the current count value. | prop   | Initialised from initialCount. |

## 8. Visual States

### 8.1 Default

- Description: Counter is displaying its initial value.
- Visuals: Number centered; increment/decrement buttons on each side.
