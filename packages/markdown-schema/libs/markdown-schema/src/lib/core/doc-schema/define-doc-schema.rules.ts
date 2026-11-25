import type { Root } from 'mdast';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import { z } from 'zod';
import type { Extractor } from '../extractors/extractor.model.ts';
import { freetext } from '../extractors/freetext.rules.ts';
import { extractSummary } from './extract-summary.rules.ts';
import { splitDoc } from './split-doc.rules.ts';

/**
 * Specification for a single section within a document schema.
 * @typeParam S - The Zod schema type that validates the extracted section value.
 */
export type SectionSpec<S extends z.ZodType = z.ZodType> = {
  /** H2 heading text in the document. Defaults to the section key. */
  heading?: string;
  /** Extractor that lifts the raw section value from mdast nodes. */
  extract: Extractor<unknown>;
  /** Zod schema that validates the extracted value. */
  schema: S;
  /** When `true`, a missing section yields `undefined` instead of an error. */
  optional?: boolean;
};

/**
 * Internal shape of the spec passed to {@link defineDocSchema}.
 * Uses `z.ZodType<any>` as the section-schema bound so that the deferred
 * evaluation path inside `DocOf` degrades to `any` (not `unknown`) when
 * TypeScript cannot yet resolve the specific generic argument.
 */
type DocSpec = {
  /** Schema for the document title (extracted from the first H1 by default). */
  title?: { schema: z.ZodType };
  /**
   * Schema for the `>` summary blockquote between the title and the first section.
   * `required` makes a document without the blockquote fail; when it is `false`, an absent
   * summary is left out of the parse output. Unset, a blockquote there is ignored as before.
   */
  summary?: { schema: z.ZodType; required: boolean };
  /** Heading depth for the document title. Default `1`. */
  titleDepth?: number;
  /** Heading depth for sections. Default `2`. */
  sectionDepth?: number;
  /** Map of output key → section specification. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- `any` keeps `DocOf` from degrading to `unknown` (see above).
  sections: Record<string, SectionSpec<z.ZodType<any>>>;
  /**
   * When `false`, the document's sections may appear in any order. Defaults to
   * `true`: the sections present in the document must follow the template's
   * section order.
   */
  orderedSections?: boolean;
  /**
   * When set, a `##` section the spec does not declare is accepted instead of rejected, and
   * parsed as free text into `additionalSections`; `keyOf` derives each section's key from
   * its heading.
   */
  additionalSections?: { keyOf: (heading: string) => string };
};

/**
 * Infers the fully-typed parse result for a document schema `S` produced by
 * {@link defineDocSchema}.
 */
export type DocOf<S extends DocSpec> = {
  frontmatter?: unknown;
} & (S['title'] extends {
  schema: infer T extends z.ZodType;
}
  ? { title: z.infer<T> }
  : // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    {}) &
  (S['summary'] extends {
    schema: infer T extends z.ZodType;
  }
    ? { summary: z.infer<T> }
    : // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {}) & {
    [K in keyof S['sections']]: S['sections'][K] extends {
      optional: true;
      schema: infer T extends z.ZodType;
    }
      ? z.infer<T> | undefined
      : S['sections'][K] extends { schema: infer T extends z.ZodType }
        ? z.infer<T>
        : never;
  };

/**
 * Defines a document schema that parses and validates a markdown string.
 *
 * The returned object exposes a single `parse` method that accepts raw
 * markdown and returns a fully-typed document object, or throws a
 * `ZodError` (content issues) or plain `Error` (structural issues such as
 * missing required sections or malformed tables).
 * @param spec - The document specification including section definitions and
 *   an optional cross-section refinement callback.
 * @returns An object with a `parse(raw: string): DocOf<S>` method.
 */
export function defineDocSchema<S extends DocSpec>(
  spec: S & {
    refine?: (doc: DocOf<S>, ctx: z.core.$RefinementCtx) => void;
  },
): { parse(raw: string, options?: { tree?: Root }): DocOf<S> } {
  const shape: Record<string, z.ZodType> = {};
  // Frontmatter is always permitted (and always optional). The parser exposes
  // it on `doc.frontmatter` for refine rules and `--emit-json`; declarative
  // frontmatter constraints live in `*.refine.ts`, not in the schema shape.
  shape.frontmatter = z.unknown().optional();
  if (spec.title) shape.title = spec.title.schema;
  if (spec.summary) shape.summary = spec.summary.schema;
  for (const [key, sec] of Object.entries(spec.sections)) {
    shape[key] = sec.optional ? sec.schema.optional() : sec.schema;
  }
  if (spec.additionalSections) {
    shape.additionalSections = z
      .array(z.object({ key: z.string(), heading: z.string(), text: z.string() }))
      .optional();
  }
  let composite: z.ZodType = z.object(shape).strict();
  const refine = spec.refine;
  if (refine) {
    composite = composite.superRefine((doc, ctx) => {
      refine(doc as DocOf<S>, ctx);
    });
  }

  const sectionDepth = spec.sectionDepth ?? 2;
  const titleDepth = spec.title ? (spec.titleDepth ?? 1) : undefined;

  return {
    /**
     * Parses and validates a raw markdown string against this document schema.
     * @param raw - The raw markdown content to parse.
     * @param options - `tree`: the mdast tree of `raw`, parsed with remark, GFM and YAML frontmatter; it is read, never changed, and `raw` is parsed again only when it is absent.
     * @returns A fully-typed document object.
     */
    parse(raw: string, options?: { tree?: Root }): DocOf<S> {
      const tree =
        options?.tree ??
        unified().use(remarkParse).use(remarkFrontmatter, ['yaml']).use(remarkGfm).parse(raw);
      const { frontmatter, title, preamble, sections } = splitDoc(tree, {
        titleDepth,
        sectionDepth,
      });

      // Set of headings the template declares (fail-closed: additions rejected).
      const specHeadings = new Set<string>();
      for (const [key, sec] of Object.entries(spec.sections)) {
        specHeadings.add(sec.heading ?? key);
      }

      // Reject unknown extra H2 sections — the corpus stays structurally
      // uniform only if additions are refused, not silently dropped — unless
      // the spec is open, which parses them as free text below.
      const extras = [...sections.keys()].filter((h) => !specHeadings.has(h));
      if (extras.length > 0 && !spec.additionalSections) {
        throw new Error(`Unrecognized section(s): ${extras.map((h) => `"${h}"`).join(', ')}`);
      }

      // Enforce section ordering: the spec'd sections present in the document
      // must appear in the same relative order as the template declares them.
      if (spec.orderedSections !== false) {
        const specOrder = Object.entries(spec.sections).map(([key, sec]) => sec.heading ?? key);
        const docOrder = [...sections.keys()].filter((h) => specHeadings.has(h));
        let si = 0;
        for (const h of docOrder) {
          while (si < specOrder.length && specOrder[si] !== h) si++;
          if (si >= specOrder.length) {
            throw new Error(
              `Section "${h}" is out of order; sections must follow the template order: ${specOrder
                .map((s) => `"${s}"`)
                .join(' → ')}`,
            );
          }
          si++;
        }
      }

      const lifted: Record<string, unknown> = {};
      if (frontmatter !== undefined) lifted.frontmatter = frontmatter;
      if (spec.title) lifted.title = title;
      if (spec.summary) {
        const summary = extractSummary(preamble);
        if (summary === undefined) {
          if (spec.summary.required) {
            throw new Error(
              'Missing required summary: a "> ..." blockquote between the title and the first section',
            );
          }
        } else {
          lifted.summary = summary;
        }
      }

      for (const [key, sec] of Object.entries(spec.sections)) {
        const heading = sec.heading ?? key;
        const nodes = sections.get(heading);
        if (!nodes) {
          if (sec.optional) continue;
          throw new Error(`Missing required section: "${heading}"`);
        }
        if (nodes.length === 0 && sec.optional) continue;
        lifted[key] = sec.extract(nodes, { section: heading });
      }

      if (spec.additionalSections && extras.length > 0) {
        const { keyOf } = spec.additionalSections;
        lifted.additionalSections = extras.map((heading) => ({
          key: keyOf(heading),
          heading,
          text: freetext(sections.get(heading) ?? [], { section: heading }),
        }));
      }

      return composite.parse(lifted) as DocOf<S>;
    },
  };
}
