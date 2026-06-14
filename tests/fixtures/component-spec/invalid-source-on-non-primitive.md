# Component Spec: Card

## 1. Summary

A card container that incorrectly specifies a Source field on a non-Primitive type.

## 2. Classification

- Type: Container
- Scope: Shared
- Parent Component: n/a
- Repetition: Repeated
- Source: shadcn

## 3. Responsibilities

### 3.1 MUST

- Render a bordered card with a shadow.

### 3.2 SHOULD

- Accept a header slot.

### 3.3 MUST NOT

- Fetch data directly.

## 4. Inputs (Props)

| Prop Name | Type    | Default | Description         | Required |
| --------- | ------- | ------- | ------------------- | -------- |
| elevated  | boolean | false   | Adds a drop shadow. | No       |

## 6. Outputs (Events)

| Event Name | Payload Type | Description            | Emitted When           |
| ---------- | ------------ | ---------------------- | ---------------------- |
| onClick    | () => void   | User clicked the card. | Click on card surface. |

## 8. Visual States

### 8.1 Default

- Description: Card is visible with its default styling.
- Visuals: White background, 1px border, rounded corners.
