<!-- TEMPLATE-ONLY: guide
// A DESIGN.md document describes one theme of a visual identity for coding
// agents. Machine-readable tokens live in the YAML frontmatter; the prose
// body explains WHY those values exist and how to apply them. The frontmatter
// is the normative source; the prose is context.
//
// Frontmatter shape (validated by design.refine.ts):
//   name        — required string, the theme/identity name.
//   version     — optional, currently "alpha".
//   description — optional one-liner.
//   colors      — required map<name, CSS color>; MUST include `primary`.
//                 Values are any valid CSS color (hex/rgb/oklch/...).
//   typography  — optional map<name, {fontFamily, fontSize?, fontWeight?,
//                 lineHeight?, letterSpacing?}>.
//   rounded     — optional map<scale, dimension> (e.g. sm/md/lg).
//   spacing     — optional map<scale, dimension|number>.
//   components  — optional map<name, map<prop, value|{ref}>>. References use
//                 `{colors.primary}` / `{rounded.md}` syntax.
//
// Cross-section rules enforced by design.refine.ts:
//   - frontmatter.name is required and non-empty.
//   - frontmatter.colors is required and includes `primary`.
//   - every color value parses as a CSS color.
//   - every `{group.token}` reference resolves to a defined frontmatter token.
// The canonical body section order below is read by humans, not machine-checked
// (validate-md re-keys sections by template order).
-->

# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

<!-- TEMPLATE-ONLY: guide
// Title: the theme/identity name, matching frontmatter `name`. Summary: one
// sentence on the overall feel (audience, mood, register).
-->

## Overview

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Holistic description of the look and feel — brand personality, audience,
// emotional response. Prefer a specific reference ("a 1970s lecture handout")
// over a list of adjectives ("modern, clean"). This is the most important
// section; the tokens are context for it.
-->

## Colors

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Prose rationale for the palette. Name each key color and state where it is
// (and is NOT) used. Reference frontmatter tokens inline as `{colors.primary}`.
// The token values themselves live in the frontmatter `colors:` map.
-->

## Typography

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// The type strategy: which families, weights, and roles. Frontmatter
// `typography:` carries the precise font properties. Omit this section only
// if the identity defines no typography.
-->

## Layout

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Spacing scale and layout model (grid, margins, rhythm). Frontmatter
// `spacing:` carries the scale values.
-->

## Elevation & Depth

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// How visual hierarchy is conveyed: shadows, tonal layers, or — for flat
// designs — borders and surface-color contrast.
-->

## Shapes

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Corner radius language and shape character. Frontmatter `rounded:` carries
// the radius scale.
-->

## Components

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Style guidance for component atoms (buttons, cards, inputs, nav). Frontmatter
// `components:` carries the per-component token map; variants (hover, active)
// are separate keys like `button-primary-hover`.
-->

## Do's and Don'ts

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Practical guardrails as a bullet list. Each line a "Do" or "Don't". A
// specific reference in Overview carries most negative constraints for free;
// list the non-obvious ones here.
-->
