# Component Spec: Avatar

## 1. Summary

An avatar component with an invalid Required column value in the props table.

## 2. Classification

- Type: View
- Scope: Shared
- Parent Component: n/a
- Repetition: Single

## 3. Responsibilities

### 3.1 MUST

- Render the user's avatar image or initials fallback.

### 3.2 SHOULD

- Accept a size variant.

### 3.3 MUST NOT

- Fetch user data directly.

## 4. Inputs (Props)

| Prop Name | Type   | Default | Description               | Required |
| --------- | ------ | ------- | ------------------------- | -------- |
| src       | string | —       | Image URL for the avatar. | Optional |

## 6. Outputs (Events)

| Event Name | Payload Type | Description              | Emitted When |
| ---------- | ------------ | ------------------------ | ------------ |
| onClick    | () => void   | User clicked the avatar. | Click.       |

## 8. Visual States

### 8.1 Default

- Description: Avatar is visible with an image.
- Visuals: Circular image crop at the specified size.
