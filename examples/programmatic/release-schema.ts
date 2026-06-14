/**
 * Programmatic-mode example for `markdown-schema`.
 *
 * Where the template-mode examples (`../release-notes`, `../component`,
 * `../all-features`) derive a schema from a `*.template.md`, this file builds the
 * same kind of schema directly in TypeScript with {@link defineDocSchema}. Use
 * programmatic mode when you need full static types, custom extractors, or shapes
 * the template directives cannot express.
 *
 * This single schema exercises every public extractor and every `defineDocSchema`
 * knob:
 *
 * - `title` + `titleDepth`              — typed H1 document title
 * - `sectionDepth`                      — H2 section boundaries (explicit default)
 * - `freetext`                          — prose section, round-tripped to markdown
 * - `bulletList`                        — plain `string[]`
 * - `taskList`                          — `{ checked, text }[]`
 * - `table`                             — `Record<string, string>[]`
 * - `codeBlocks`                        — every fenced block in a section
 * - `fencedCodeWithMarker`              — the one block after a marker comment
 * - `optional(table)`                   — extractor that degrades to `undefined`
 * - `rawNodes`                          — escape hatch: untouched mdast nodes
 * - `repeated`                          — split a section by sub-heading (H3)
 * - `repeatedWhere`                     — split by an arbitrary node predicate
 * - section `optional: true`            — whole H2 may be absent
 * - `refine`                            — cross-section + frontmatter invariants
 *
 * Run it against `release.md`:
 *
 * ```bash
 * node --experimental-strip-types examples/programmatic/run.ts
 * ```
 */
import { z } from "zod";
import type { RootContent } from "mdast";
import {
  defineDocSchema,
  freetext,
  table,
  bulletList,
  taskList,
  codeBlocks,
  rawNodes,
  fencedCodeWithMarker,
  optional,
  repeated,
  repeatedWhere,
} from "markdown-schema";

/** One row of the "Acceptance Criteria" GFM table. */
const AcceptanceRow = z
  .object({
    ID: z.string().regex(/^AC-\d+$/, "must look like AC-001"),
    Description: z.string().min(1),
    Priority: z.enum(["Low", "Medium", "High"]),
  })
  .strict();

/** One "### add|fix|chore: …" group inside the "Changes" section. */
const Change = z
  .object({
    heading: z.string().regex(/^(add|fix|chore): /, "must be add|fix|chore:"),
    description: z.string().min(1),
    // `optional(table)` → the params table is allowed to be absent.
    params: z.array(z.record(z.string(), z.string())).optional(),
    snippets: z.array(
      z.object({ lang: z.string().nullable(), value: z.string() }),
    ),
  })
  .strict();

/** One thematic-break-separated step inside the "Migration" section. */
const MigrationStep = z.object({
  heading: z.string(),
  body: z.string().min(1),
});

/**
 * Full release-notes schema. The output type is inferred end-to-end — hover
 * `ReleaseDoc` to see the typed `parse` result.
 */
export const ReleaseDoc = defineDocSchema({
  // H1 title, validated as semver. `titleDepth: 1` is the default, shown for
  // completeness.
  title: { schema: z.string().regex(/^v\d+\.\d+\.\d+$/, "must be semver") },
  titleDepth: 1,
  sectionDepth: 2,

  sections: {
    // freetext → the whole section body serialized back to markdown.
    summary: {
      heading: "Summary",
      extract: freetext,
      schema: z.string().min(10),
    },

    // bulletList → plain `string[]` (labeled `- Key: value` lists are a
    // template-mode inference, not this extractor).
    highlights: {
      heading: "Highlights",
      extract: bulletList,
      schema: z.array(z.string()).min(1),
    },

    // taskList → `{ checked, text }[]`.
    checklist: {
      heading: "Checklist",
      extract: taskList,
      schema: z
        .array(z.object({ checked: z.boolean(), text: z.string() }))
        .min(1),
    },

    // table → `Record<string, string>[]`, then refined per-row by Zod.
    acceptanceCriteria: {
      heading: "Acceptance Criteria",
      extract: table,
      schema: z.array(AcceptanceRow).min(1),
    },

    // codeBlocks → every fenced block in the section.
    examples: {
      heading: "Examples",
      extract: codeBlocks,
      schema: z
        .array(z.object({ lang: z.string().nullable(), value: z.string() }))
        .min(1),
    },

    // fencedCodeWithMarker → the single block following a marker comment.
    signature: {
      heading: "Signature",
      extract: fencedCodeWithMarker({
        marker: /prettier-ignore/,
        markerLabel: "<!-- prettier-ignore -->",
      }),
      schema: z.object({ lang: z.string(), value: z.string() }),
    },

    // repeated → split by H3 sub-heading; each group runs its own sub-extractors.
    // `optional(table)` makes the params table per-change optional; codeBlocks
    // collects any snippets under the change.
    changes: {
      heading: "Changes",
      extract: repeated({
        shape: {
          description: freetext,
          params: optional(table),
          snippets: codeBlocks,
        },
      }),
      schema: z.array(Change).min(1),
    },

    // repeatedWhere → split by an arbitrary predicate (here: thematic breaks),
    // for groups that are not heading-delimited.
    migration: {
      heading: "Migration",
      extract: repeatedWhere({
        startsAt: (n: RootContent) => n.type === "thematicBreak",
        shape: { body: freetext },
      }),
      schema: z.array(MigrationStep),
      optional: true,
    },

    // rawNodes → escape hatch: the untouched mdast `RootContent[]`. Useful when
    // no built-in extractor fits and you want to post-process the AST yourself.
    appendix: {
      heading: "Appendix",
      extract: rawNodes,
      schema: z.array(z.object({ type: z.string() }).loose()).min(1),
      optional: true,
    },
  },

  // Cross-section + frontmatter invariants. Across the package boundary the
  // public `DocOf` type degrades the `doc` argument to `any` (by design — see
  // the `DocOf` doc comment), so narrow it to the fields this rule reads.
  refine: (rawDoc, ctx) => {
    const doc = rawDoc as {
      frontmatter?: { stage?: string };
      checklist: { checked: boolean }[];
      migration?: unknown[];
    };

    // 1. Frontmatter rule: a `stage` key must be present and one of the
    //    allowed values. Frontmatter is exposed, never schema-validated, so its
    //    rules live here.
    const stage = doc.frontmatter?.stage;
    if (stage !== "alpha" && stage !== "beta" && stage !== "ga") {
      ctx.addIssue({
        code: "custom",
        path: ["frontmatter", "stage"],
        message: 'frontmatter.stage must be "alpha", "beta", or "ga"',
      });
    }

    // 2. Cross-section rule: pending checklist items require migration steps.
    const hasPending = doc.checklist.some((item) => !item.checked);
    if (hasPending && (!doc.migration || doc.migration.length === 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["migration"],
        message:
          "Migration steps are required while checklist items are pending",
      });
    }
  },
});
