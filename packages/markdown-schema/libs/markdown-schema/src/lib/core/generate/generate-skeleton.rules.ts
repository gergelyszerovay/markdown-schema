import type { TemplateShape } from '../template/template-shape.model.ts';
import { buildDocumentTree } from './build-document-tree.rules.ts';
import { serializeTree } from './serialize-tree.rules.ts';
import { skeletonData } from './skeleton-data.rules.ts';

/**
 * Writes a skeleton from a template's shape alone: the headings in order, each table with
 * its header row and one placeholder row (the column's default where it declares one,
 * `<column>` elsewhere, `[ ]` for a checkbox column), each labeled list with its keys, and
 * `<...>` placeholders for the title, the summary, freetext and list items. Optional
 * sections are included.
 *
 * A skeleton is a starting point and need not validate: a placeholder may fail a regex. It
 * replaces the copy-the-template workflow.
 * @param shape - The template's shape, from `parseTemplate(...).shape`.
 * @returns The skeleton's markdown text, ending with one newline.
 */
export function generateSkeleton(shape: TemplateShape): string {
  return serializeTree(
    buildDocumentTree(shape, skeletonData(shape), (value) => [{ type: 'html', value }]),
  );
}
