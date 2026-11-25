# Component Spec: Button

## 1. Summary

A single-purpose action trigger that renders a labelled button and fires an
`onClick` event when the user activates it. Supports disabled and loading
states.

## 2. Classification

- Type: View
- Scope: Shared
- Parent Component: n/a
- Repetition: Conditional

## 3. Responsibilities

### 3.1 MUST

- Render a labelled, accessible button element.
- Fire `onClick` when the user clicks or presses Enter/Space.
- Apply the disabled visual when `disabled` is true and suppress `onClick`.

### 3.2 SHOULD

- Show a spinner in place of the label when `loading` is true.
- Forward a `ref` to the underlying `<button>` element.

### 3.3 MUST NOT

- Manage navigation or side-effects; those belong in the caller.
- Override browser focus styles without providing an accessible alternative.

## 4. Inputs (Props)

| Prop Name | Type                                | Default   | Description                                        | Required |
| --------- | ----------------------------------- | --------- | -------------------------------------------------- | -------- |
| label     | string                              | —         | Visible button text or accessible label.           | Yes      |
| disabled  | boolean                             | false     | Prevents interaction and applies disabled styling. | No       |
| loading   | boolean                             | false     | Replaces label with a spinner; implies disabled.   | No       |
| variant   | "primary" \| "secondary" \| "ghost" | "primary" | Visual style variant.                              | No       |

## 6. Outputs (Events)

| Event Name | Payload Type | Description                                 | Emitted When                                                 |
| ---------- | ------------ | ------------------------------------------- | ------------------------------------------------------------ |
| onClick    | () => void   | Signals user intent to activate the button. | User clicks or presses Enter/Space on a non-disabled button. |

## 8. Visual States

### 8.1 Default

- Description: Normal interactive state; no interaction in progress.
- Visuals: Filled primary background, white label, full opacity.

### 8.2 Hover

- Description: Pointer is over the button.
- Visuals: Background lightens by 10%; cursor changes to pointer.

### 8.3 Focused

- Description: Button receives keyboard focus.
- Visuals: 2px offset focus ring matches the brand accent colour.

### 8.4 Disabled

- Description: `disabled` or `loading` is true.
- Visuals: 40% opacity; cursor changes to not-allowed; `onClick` is suppressed.

### 8.5 Loading

- Description: `loading` is true; action is in progress.
- Visuals: Label replaced by a spinner; button is disabled while in this state.
