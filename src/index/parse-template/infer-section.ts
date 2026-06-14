import { z } from "zod";
import type { ZodTypeAny } from "zod";
import type { RootContent, List, Heading } from "mdast";
import type { Html } from "mdast";
import { bulletList } from "./infer-section/bullet-list";
import { freetext } from "./infer-section/freetext";
import { table } from "./infer-section/table";
import { taskList } from "./infer-section/task-list";
import { optional as optionalExtractor } from "./infer-section/optional";
import { repeated } from "./infer-section/repeated";
import type { Extractor } from "../_shared/extractor";
import {
  extractDirectiveBody,
  parseDirective,
} from "./_shared/parse-directive";
import { buildRowSchema } from "./infer-section/build-row-schema";
import { parseBlockDirectives } from "./infer-section/parse-block-directives";
import { findDirective } from "./infer-section/find-directive";
import { collectItemDirectives } from "./_shared/collect-item-directives";
import { isLabeledList } from "./infer-section/is-labeled-list";
import { isTaskList } from "./infer-section/is-task-list";
import { buildLabeledListSchema } from "./infer-section/build-labeled-list-schema";
import { buildRepeatedSchema } from "./infer-section/build-repeated-schema";
import { directiveToFieldSchema } from "./infer-section/directive-to-field-schema";
import { DirectiveError } from "./_shared/directive-error";

/** Result produced for one section by {@link inferSection}. */
export type SectionInference = {
  extract: Extractor<unknown>;
  schema: ZodTypeAny;
  /** The whole section heading may be absent from the document. */
  optional?: boolean;
};

/**
 * Infers the extractor and Zod schema for a single document section from its
 * mdast body nodes.
 *
 * @param nodes - The body nodes for the section (after the H2 heading).
 * @param _heading - The heading text (used in error messages).
 * @returns Extractor, schema, and optional flag for this section.
 */
export function inferSection(
  nodes: RootContent[],
  _heading: string,
): SectionInference {
  const blockDirectives = parseBlockDirectives(nodes);

  const sectionDir = findDirective(blockDirectives, "section");
  const rowDir = findDirective(blockDirectives, "row");
  const freetextDir = findDirective(blockDirectives, "freetext");

  const isOptional =
    (sectionDir?.optional ?? rowDir?.sectionOptional ?? false) ||
    (freetextDir?.optional ?? false);

  // Content nodes: everything that isn't a block html TEMPLATE-ONLY comment
  const contentNodes = nodes.filter((n) => {
    if (n.type !== "html") return true;
    const body = extractDirectiveBody(n.value);
    return body === null;
  });

  // 0. Explicit freetext directive → free-form markdown string
  if (freetextDir) {
    if (rowDir) {
      throw new Error(
        `Section "${_heading}" cannot use both 'freetext' and 'row' directives`,
      );
    }
    let extract: Extractor<unknown> = freetext;
    let schema: ZodTypeAny = z.string().min(1);
    if (isOptional) {
      extract = optionalExtractor(freetext);
      schema = schema.optional();
    }
    return { extract, schema, optional: isOptional };
  }

  // 1. Sub-headings → repeated
  const hasSubHeadings = contentNodes.some(
    (n): n is Heading => n.type === "heading",
  );
  if (hasSubHeadings) {
    const minGroups = sectionDir?.minGroups;
    const maxGroups = sectionDir?.maxGroups;

    // Check the first H3 for an inline directive (Step 6.5)
    let headingSchema: ZodTypeAny | undefined;
    const firstHeading = contentNodes.find(
      (n): n is Heading => n.type === "heading",
    );
    if (firstHeading) {
      const inlineHtml = firstHeading.children.find(
        (c): c is Html => c.type === "html",
      );
      if (inlineHtml) {
        const body = extractDirectiveBody(inlineHtml.value);
        if (body) {
          const dir = parseDirective(body);
          if (dir.kind === "field" || dir.kind === "enum") {
            headingSchema = directiveToFieldSchema(dir);
          } else {
            throw new DirectiveError(
              `H3 sub-headings only support inline field or enum directives, got: ${dir.kind}`,
            );
          }
        }
      }
    }

    const schema = buildRepeatedSchema(
      contentNodes,
      minGroups,
      maxGroups,
      headingSchema,
    );
    return {
      extract: repeated({ shape: { items: bulletList } }),
      schema,
      optional: isOptional,
    };
  }

  // 2. Row directive + table → table section
  const hasTable = contentNodes.some((n) => n.type === "table");
  if (rowDir || hasTable) {
    let rowSchema: ZodTypeAny = z.record(z.string(), z.string());
    if (rowDir) rowSchema = buildRowSchema(rowDir.columns);

    let arraySchema: ZodTypeAny = z.array(rowSchema);
    if (rowDir?.minRows)
      arraySchema = (arraySchema as ReturnType<typeof z.array>).min(
        rowDir.minRows,
      );
    if (rowDir?.maxRows)
      arraySchema = (arraySchema as ReturnType<typeof z.array>).max(
        rowDir.maxRows,
      );

    let extract: Extractor<unknown> = table;
    if (isOptional) {
      extract = optionalExtractor(table);
      arraySchema = arraySchema.optional();
    }

    return { extract, schema: arraySchema, optional: isOptional };
  }

  // 3. Labeled bullet list (items have enum/field directives)
  const listNode = contentNodes.find((n): n is List => n.type === "list");
  if (listNode) {
    if (isTaskList(listNode)) {
      return {
        extract: taskList,
        schema: z.array(z.object({ checked: z.boolean(), text: z.string() })),
        optional: isOptional,
      };
    }

    const itemDirs = collectItemDirectives(listNode);
    if (isLabeledList(listNode)) {
      const schema = buildLabeledListSchema(itemDirs);
      return { extract: bulletList, schema, optional: isOptional };
    }

    // Plain bullet list
    return {
      extract: bulletList,
      schema: z.array(z.string()),
      optional: isOptional,
    };
  }

  // No recognized shape and no freetext directive → hard error
  throw new Error(
    `Section "${_heading}" has no recognized shape; add a 'freetext' directive if free-form content is intended`,
  );
}
