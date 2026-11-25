import { z } from 'zod';
import { bulletList } from '../extractors/bullet-list.rules.ts';
import { freetext } from '../extractors/freetext.rules.ts';
import { table } from '../extractors/table.rules.ts';
import { taskList } from '../extractors/task-list.rules.ts';
import { repeated } from '../extractors/repeated.rules.ts';
import type { Extractor } from '../extractors/extractor.model.ts';
import type { ColumnSpec } from '../directive/column-spec.model.ts';
import type { ParsedDirective } from '../directive/parsed-directive.model.ts';
import { compileUserRegex } from '../directive/compile-user-regex.rules.ts';
import { buildRowSchema } from './build-row-schema.rules.ts';
import { buildLabeledListSchema } from './build-labeled-list-schema.rules.ts';
import { buildRepeatedSchema } from './build-repeated-schema.rules.ts';
import { directiveToFieldSchema } from './directive-to-field-schema.rules.ts';
import type { FieldShape, GroupHeadingShape, SectionBodyShape } from './template-shape.model.ts';

/** The extractor and Zod schema compiled from one section's shape. */
export type CompiledSection = {
  extract: Extractor<unknown>;
  schema: z.ZodType;
};

/**
 * Maps a published field shape back to the parsed-directive form the labeled-list schema
 * builder consumes.
 * @param field - The field's shape.
 * @returns The equivalent parsed directive.
 */
function toDirective(field: FieldShape): ParsedDirective {
  if (field.choices) return { kind: 'enum', choices: field.choices, required: field.required };
  return {
    kind: 'field',
    required: field.required,
    regex: field.pattern,
    defaultValue: field.defaultValue,
    onlyIf: field.onlyIf,
  };
}

/**
 * Compiles the heading schema of a repeated-groups section from its shape.
 * @param heading - The H3 heading's shape, when the template constrains it.
 * @returns The Zod schema for each group's heading, or `undefined` for the default.
 */
function compileGroupHeading(heading: GroupHeadingShape | undefined): z.ZodType | undefined {
  if (!heading) return undefined;
  if (heading.choices) {
    return directiveToFieldSchema({
      kind: 'enum',
      choices: heading.choices,
      required: heading.required,
    });
  }
  return directiveToFieldSchema({
    kind: 'field',
    required: heading.required,
    regex: heading.pattern,
  });
}

/**
 * Compiles one section's shape into its extractor and Zod schema — the "how to validate"
 * half of the old `inferSection`. The shape alone determines both, so a template compiles
 * entirely from its {@link TemplateShape}.
 * @param body - The section body's shape.
 * @returns The extractor and schema for the section.
 */
export function compileSectionShape(body: SectionBodyShape): CompiledSection {
  switch (body.kind) {
    case 'freetext':
      return { extract: freetext, schema: z.string().min(1) };
    case 'repeated-groups': {
      const schema = buildRepeatedSchema(
        body.minGroups,
        body.maxGroups,
        compileGroupHeading(body.heading),
      );
      return { extract: repeated({ shape: { items: bulletList } }), schema };
    }
    case 'table': {
      let rowSchema: z.ZodType = z.record(z.string(), z.string());
      if (body.declared) {
        const columns: Record<string, ColumnSpec> = {};
        for (const column of body.columns) {
          columns[column.header] = {
            required: column.required,
            key: column.key,
            regex: column.pattern,
            enumChoices: column.choices,
            defaultValue: column.defaultValue,
            checkbox: column.kind === 'checkbox' ? true : undefined,
          };
        }
        rowSchema = buildRowSchema(columns);
      }
      let arraySchema: z.ZodType = z.array(rowSchema);
      if (body.minRows) arraySchema = (arraySchema as ReturnType<typeof z.array>).min(body.minRows);
      if (body.maxRows) arraySchema = (arraySchema as ReturnType<typeof z.array>).max(body.maxRows);
      return { extract: table, schema: arraySchema };
    }
    case 'task-list': {
      const text = body.pattern
        ? z.string().regex(compileUserRegex(body.pattern, 'task item'))
        : z.string();
      let arraySchema: z.ZodType = z.array(z.object({ checked: z.boolean(), text }));
      if (body.minItems)
        arraySchema = (arraySchema as ReturnType<typeof z.array>).min(body.minItems);
      if (body.maxItems)
        arraySchema = (arraySchema as ReturnType<typeof z.array>).max(body.maxItems);
      return { extract: taskList, schema: arraySchema };
    }
    case 'labeled-list': {
      const itemDirectives: Record<string, ParsedDirective | null> = {};
      for (const field of body.fields) itemDirectives[field.label] = toDirective(field);
      return { extract: bulletList, schema: buildLabeledListSchema(itemDirectives) };
    }
    case 'plain-list':
      return { extract: bulletList, schema: z.array(z.string()) };
  }
}
