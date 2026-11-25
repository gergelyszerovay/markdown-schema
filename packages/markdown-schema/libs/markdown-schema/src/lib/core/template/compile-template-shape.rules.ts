import type { Root } from 'mdast';
import { z } from 'zod';
import { defineDocSchema } from '../doc-schema/define-doc-schema.rules.ts';
import type { DocumentData } from '../doc-schema/document-data.model.ts';
import type { RefineFunction } from '../refine-function.model.ts';
import { compileUserRegex } from '../directive/compile-user-regex.rules.ts';
import { DirectiveError } from '../directive/directive.error.ts';
import { compileSectionShape } from './compile-section-shape.rules.ts';
import { headingToKey } from './heading-to-key.rules.ts';
import type { KeyColumn } from './key-column.model.ts';
import type { TemplateShape } from './template-shape.model.ts';

/** What {@link compileTemplateShape} builds from a template's shape. */
export type CompiledTemplate = {
  /** Parses and validates a document; see `ParsedTemplate.parse`. */
  parse: (raw: string, options?: { tree?: Root }) => DocumentData;
  /** The key columns of the shape's tables, in template order. */
  keyColumns: KeyColumn[];
};

/**
 * Compiles the title schema from the shape.
 * @param title - The title's shape.
 * @returns The Zod schema the title text must satisfy.
 */
function compileTitle(title: { pattern?: string; message?: string }): z.ZodType {
  if (title.pattern === undefined) return z.string().min(1);
  return z.string().regex(new RegExp(title.pattern), title.message);
}

/**
 * Compiles the summary schema from the shape, like a field directive: non-empty, matching
 * the declared regex, and optional when the directive says so.
 * @param summary - The summary's shape.
 * @returns The Zod schema the summary text must satisfy.
 */
function compileSummary(summary: { required: boolean; pattern?: string }): z.ZodType {
  const base = summary.pattern
    ? z.string().min(1).regex(compileUserRegex(summary.pattern, 'summary'))
    : z.string().min(1);
  return summary.required ? base : base.optional();
}

/**
 * Compiles a template's shape into the document schema and key-column list `parseTemplate`
 * returns. The shape alone carries everything the compiler reads — the template's tree is
 * not consulted — so the shape is the single source of truth for validation.
 *
 * The compiled refine enforces, in order: every `remove-if` guard (the section must be
 * absent when the named labeled-list field has the given value), the uniqueness of key
 * column values across the whole document, then the caller's own refine.
 * @param shape - The template's shape, from `inferTemplateShape`.
 * @param opts - Optional configuration. `refine`: cross-section refinement callback to
 *   attach. `file`: source file path used in error messages. `orderedSections`: when
 *   `false`, disables the section-order check; a shape declared `unordered` disables it
 *   whatever this says.
 * @returns The compiled `parse` function and the shape's key columns.
 */
export function compileTemplateShape(
  shape: TemplateShape,
  opts?: { refine?: RefineFunction; file?: string; orderedSections?: boolean },
): CompiledTemplate {
  const sectionSpecs: Record<
    string,
    {
      heading: string;
      extract: ReturnType<typeof compileSectionShape>['extract'];
      schema: ReturnType<typeof compileSectionShape>['schema'];
      optional?: boolean;
    }
  > = {};
  const keyColumns: KeyColumn[] = [];

  for (const section of shape.sections) {
    const compiled = compileSectionShape(section.body);
    sectionSpecs[section.key] = {
      heading: section.heading,
      extract: compiled.extract,
      schema: compiled.schema,
      optional: section.optional,
    };
    if (section.body.kind === 'table') {
      for (const column of section.body.columns) {
        if (column.key)
          keyColumns.push({
            section: section.key,
            heading: section.heading,
            column: column.header,
          });
      }
    }
  }

  // Resolve `remove-if Key=Value` guards. The label key must be declared in
  // exactly one labeled-list section (zero or many → template error).
  const labelToSections = new Map<string, string[]>();
  for (const section of shape.sections) {
    if (section.body.kind !== 'labeled-list') continue;
    for (const field of section.body.fields) {
      const arr = labelToSections.get(field.label) ?? [];
      arr.push(section.key);
      labelToSections.set(field.label, arr);
    }
  }

  const removeIfRules: {
    guardKey: string;
    guardHeading: string;
    ownerKey: string;
    labelKey: string;
    value: string;
  }[] = [];
  for (const section of shape.sections) {
    if (!section.removeIf) continue;
    const { key: labelKey, value } = section.removeIf;
    const owners = labelToSections.get(labelKey) ?? [];
    const [ownerKey] = owners;
    if (ownerKey === undefined) {
      throw new DirectiveError(
        `remove-if key "${labelKey}" for section "${section.heading}" is not declared in any labeled-list section`,
        { file: opts?.file },
      );
    }
    if (owners.length > 1) {
      throw new DirectiveError(
        `remove-if key "${labelKey}" for section "${section.heading}" is ambiguous; it is declared in ${String(owners.length)} sections (${owners.join(', ')})`,
        { file: opts?.file },
      );
    }
    removeIfRules.push({
      guardKey: section.key,
      guardHeading: section.heading,
      ownerKey,
      labelKey,
      value,
    });
  }

  const userRefine = opts?.refine as
    ((doc: Record<string, unknown>, ctx: z.core.$RefinementCtx) => void) | undefined;

  const refine =
    removeIfRules.length === 0 && keyColumns.length === 0 && !userRefine
      ? undefined
      : (doc: Record<string, unknown>, ctx: z.core.$RefinementCtx): void => {
          for (const r of removeIfRules) {
            const owner = doc[r.ownerKey] as Record<string, unknown> | undefined;
            const guardVal = owner ? owner[r.labelKey] : undefined;
            const present = doc[r.guardKey] !== undefined;
            if (guardVal === r.value && present) {
              ctx.addIssue({
                code: 'custom',
                path: [r.guardKey],
                message: `Section "${r.guardHeading}" must be removed when ${r.labelKey}=${r.value}`,
              });
            }
          }
          const seen = new Set<string>();
          for (const { section, column } of keyColumns) {
            const rows = doc[section];
            if (!Array.isArray(rows)) continue;
            (rows as Record<string, unknown>[]).forEach((row, index) => {
              const value = row[column];
              if (typeof value !== 'string' || value.length === 0) return;
              if (seen.has(value)) {
                ctx.addIssue({
                  code: 'custom',
                  path: [section, index, column],
                  message: `Duplicate key "${value}": key values are unique across the document`,
                });
              }
              seen.add(value);
            });
          }
          userRefine?.(doc, ctx);
        };

  const schema = defineDocSchema({
    title: shape.title ? { schema: compileTitle(shape.title) } : undefined,
    summary: shape.summary
      ? { schema: compileSummary(shape.summary), required: shape.summary.required }
      : undefined,
    sections: sectionSpecs,
    orderedSections: shape.unordered ? false : opts?.orderedSections,
    additionalSections: shape.open ? { keyOf: headingToKey } : undefined,
    refine,
  });
  return {
    parse: (raw, options) => schema.parse(raw, options),
    keyColumns,
  };
}
