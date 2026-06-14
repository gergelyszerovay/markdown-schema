import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { z } from "zod";
import type { ZodTypeAny } from "zod";
import type { Extractor } from "../_shared/extractor";
import { splitDoc } from "./define-doc-schema/split-doc";

/**
 * Specification for a single section within a document schema.
 *
 * @template S - The Zod schema type that validates the extracted section value.
 */
export type SectionSpec<S extends ZodTypeAny = ZodTypeAny> = {
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
  title?: { schema: ZodTypeAny };
  /** Heading depth for the document title. Default `1`. */
  titleDepth?: number;
  /** Heading depth for sections. Default `2`. */
  sectionDepth?: number;
  /** Map of output key → section specification. */
  sections: Record<string, SectionSpec<z.ZodType<any>>>;
};

/**
 * Infers the fully-typed parse result for a document schema `S` produced by
 * {@link defineDocSchema}.
 */
export type DocOf<S extends DocSpec> = { frontmatter?: unknown } & (S["title"] extends {
  schema: infer T extends ZodTypeAny;
}
  ? { title: z.infer<T> }
  : // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    {}) & {
  [K in keyof S["sections"]]: S["sections"][K] extends {
    optional: true;
    schema: infer T extends ZodTypeAny;
  }
    ? z.infer<T> | undefined
    : S["sections"][K] extends { schema: infer T extends ZodTypeAny }
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
 *
 * @param spec - The document specification including section definitions and
 *   an optional cross-section refinement callback.
 * @returns An object with a `parse(raw: string): DocOf<S>` method.
 */
export function defineDocSchema<S extends DocSpec>(
  spec: S & {
    refine?: (doc: DocOf<S>, ctx: z.core.$RefinementCtx) => void;
  },
) {
  const shape: Record<string, ZodTypeAny> = {};
  // Frontmatter is always permitted (and always optional). The parser exposes
  // it on `doc.frontmatter` for refine rules and `--emit-json`; declarative
  // frontmatter constraints live in `*.refine.ts`, not in the schema shape.
  shape.frontmatter = z.unknown().optional();
  if (spec.title) shape.title = spec.title.schema;
  for (const [key, sec] of Object.entries(spec.sections)) {
    shape[key] = sec.optional ? sec.schema.optional() : sec.schema;
  }
  let composite: ZodTypeAny = z.object(shape).strict();
  if (spec.refine) {
    composite = composite.superRefine((doc, ctx) =>
      spec.refine!(doc as DocOf<S>, ctx),
    );
  }

  const sectionDepth = spec.sectionDepth ?? 2;
  const titleDepth = spec.title ? (spec.titleDepth ?? 1) : undefined;

  return {
    /**
     * Parses and validates a raw markdown string against this document schema.
     *
     * @param raw - The raw markdown content to parse.
     * @returns A fully-typed document object.
     */
    parse(raw: string): DocOf<S> {
      const tree = unified()
        .use(remarkParse)
        .use(remarkFrontmatter, ["yaml"])
        .use(remarkGfm)
        .parse(raw);
      const { frontmatter, title, sections } = splitDoc(tree, {
        titleDepth,
        sectionDepth,
      });

      const lifted: Record<string, unknown> = {};
      if (frontmatter !== undefined) lifted.frontmatter = frontmatter;
      if (spec.title) lifted.title = title;

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

      return composite.parse(lifted) as DocOf<S>;
    },
  };
}
