import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { z } from "zod";
import { defineDocSchema } from "./parse-template/define-doc-schema";
import { inferSection } from "./parse-template/infer-section";
import type { RefineFunction } from "./parse-template/load-refine";
import { splitSections } from "./parse-template/split-sections";
import { buildTitleSchema } from "./parse-template/build-title-schema";
import { headingToKey } from "./parse-template/heading-to-key";
import { validateDirectiveShape } from "./parse-template/validate-directive-shape";

export { headingToKey };

/**
 * Parses a `*.template.md` document into a `defineDocSchema` schema object
 * that can validate filled instances of the template.
 *
 * The template's `<!-- TEMPLATE-ONLY: -->` directives drive schema inference:
 * - `enum:` → `z.enum([...])`
 * - field directives (`string; …`) → typed scalar with optional/required/regex modifiers
 * - `row` directive → table row schema
 * - `section` directive → optional/remove-if/min-groups for the section
 * - `guide` directive → author prose, ignored by the schema
 *
 * An optional `refine` function (loaded separately via {@link loadRefine})
 * can be supplied via `opts.refine` to add cross-section invariants.
 *
 * Inline directives must close on the same line as the opener. Multi-line
 * bodies are reserved for block directives. Unknown directive keywords are
 * hard errors with position information.
 *
 * @param templateRaw - Raw markdown content of the template file.
 * @param opts - Optional configuration.
 * @param opts.refine - Cross-section refinement callback to attach.
 * @param opts.file - Source file path used in error messages.
 * @returns A schema object with a `parse(raw: string)` method.
 */
export function parseTemplate(
  templateRaw: string,
  opts?: { refine?: RefineFunction; file?: string },
): { parse(raw: string): Record<string, unknown> } {
  validateDirectiveShape(templateRaw, opts?.file);
  const tree = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkGfm)
    .parse(templateRaw);

  const titleDepth = 1;
  const sectionDepth = 2;

  const titleValidation = buildTitleSchema(tree, titleDepth);
  const sections = splitSections(tree, titleDepth, sectionDepth);

  // Build section specs
  const sectionSpecs: Record<
    string,
    {
      heading: string;
      extract: ReturnType<typeof inferSection>["extract"];
      schema: ReturnType<typeof inferSection>["schema"];
      optional?: boolean;
    }
  > = {};

  for (const [heading, nodes] of sections) {
    const inference = inferSection(nodes, heading);

    // Derive a camelCase key from the heading (e.g. "1. Summary" → "summary")
    const key = headingToKey(heading);

    sectionSpecs[key] = {
      heading,
      extract: inference.extract,
      schema: inference.schema,
      optional: inference.optional,
    };
  }

  return defineDocSchema({
    title: titleValidation ? { schema: titleValidation } : undefined,
    sections: sectionSpecs,
    refine: opts?.refine as
      | ((doc: Record<string, unknown>, ctx: z.core.$RefinementCtx) => void)
      | undefined,
  }) as { parse(raw: string): Record<string, unknown> };
}
