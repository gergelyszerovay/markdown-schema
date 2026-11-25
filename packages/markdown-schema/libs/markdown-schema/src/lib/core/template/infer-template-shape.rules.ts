import type { Root } from 'mdast';
import { DirectiveError } from '../directive/directive.error.ts';
import { headingToKey } from './heading-to-key.rules.ts';
import { inferSectionShape } from './infer-section-shape.rules.ts';
import { inferSummaryShape } from './infer-summary-shape.rules.ts';
import { inferTitleShape } from './infer-title-shape.rules.ts';
import { readDocumentDirective } from './read-document-directive.rules.ts';
import { splitSections } from './split-sections.rules.ts';
import type { SectionShape, TemplateShape } from './template-shape.model.ts';

/**
 * Infers a template's {@link TemplateShape} from its mdast tree: the document directive,
 * the title and summary shapes, and one section shape per H2. The shape is what the
 * template declares, as plain data; `compileTemplateShape` turns it into the validation
 * schema, so inference holds every template-authoring check that reads the tree.
 * @param tree - The template's mdast tree.
 * @param opts - Optional context. `file`: source file path used in error messages.
 *   `titleDepth` and `sectionDepth` default to 1 and 2.
 * @returns The template's shape.
 */
export function inferTemplateShape(
  tree: Root,
  opts?: { file?: string; titleDepth?: number; sectionDepth?: number },
): TemplateShape {
  const titleDepth = opts?.titleDepth ?? 1;
  const sectionDepth = opts?.sectionDepth ?? 2;

  const documentOptions = readDocumentDirective(tree, sectionDepth, opts?.file);
  const title = inferTitleShape(tree, titleDepth);
  const summary = inferSummaryShape(tree, sectionDepth, opts?.file);

  const sections: SectionShape[] = [];
  const seenKeys = new Set<string>();
  for (const [heading, nodes] of splitSections(tree, titleDepth, sectionDepth)) {
    const inference = inferSectionShape(nodes, heading);

    // Derive a camelCase key from the heading (e.g. "1. Summary" → "summary")
    const key = headingToKey(heading);

    // Two distinct H2s that collapse to the same key would silently overwrite
    // one section's spec — reject at template-parse time.
    if (seenKeys.has(key)) {
      throw new DirectiveError(
        `section heading "${heading}" collides with an earlier section on the derived key "${key}"; rename one heading`,
        { file: opts?.file },
      );
    }
    seenKeys.add(key);

    sections.push({
      key,
      heading,
      optional: inference.optional,
      removeIf: inference.removeIf,
      body: inference.body,
    });
  }

  // The document summary lives beside the sections in the parse output, so a declared
  // summary directive and a section keyed `summary` would collide — reject at parse time.
  if (summary && seenKeys.has('summary')) {
    throw new DirectiveError(
      'a template with a summary directive cannot also declare a section whose key is "summary"; rename the section heading',
      { file: opts?.file },
    );
  }

  return {
    open: documentOptions.open,
    unordered: documentOptions.unordered,
    title,
    summary,
    sections,
  };
}
