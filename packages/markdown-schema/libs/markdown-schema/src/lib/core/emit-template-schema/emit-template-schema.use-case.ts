import { errorMessage } from '../error-message.rules.ts';
import type { TextFiles } from '../text-files.port.ts';
import { baseName } from '../binding/base-name.rules.ts';
import { templateNameOf } from '../binding/template-name.rules.ts';
import { templateJsonSchema } from '../json-schema/template-json-schema.rules.ts';
import { parseTemplate } from '../template/parse-template.rules.ts';
import type { EmitTemplateSchemaInput } from './emit-template-schema.input.ts';
import type { EmitTemplateSchemaResult } from './emit-template-schema.result.ts';

/** Emits the JSON Schema of a template, for `validate-md --emit-schema`. */
export type EmitTemplateSchema = (
  input: EmitTemplateSchemaInput,
) => Promise<EmitTemplateSchemaResult>;

/**
 * Creates the use case behind `validate-md --template <t> --emit-schema`: reads the
 * template, infers its shape, and serializes the shape's JSON Schema. The template's
 * `refine` companion is never loaded — refines are code and the schema documents the
 * structural contract only — so emitting a schema runs no template-supplied code.
 * @param deps - The ports the use case reads through: `textFiles` reads the template.
 * @returns The use case.
 * @failure An unreadable template resolves with `template-unreadable`, a template that
 * does not compile with `template-invalid`; nothing rejects.
 */
export function makeEmitTemplateSchema({
  textFiles,
}: {
  textFiles: TextFiles;
}): EmitTemplateSchema {
  return async (input) => {
    let templateRaw: string;
    try {
      templateRaw = await textFiles.read(input.templatePath);
    } catch (error) {
      return { kind: 'template-unreadable', message: errorMessage(error) };
    }
    try {
      const { shape } = parseTemplate(templateRaw, { file: input.templatePath });
      const name = templateNameOf(baseName(input.templatePath).replace(/\.template\.md$/i, '.md'));
      const schema = templateJsonSchema(shape, name === null ? undefined : { name });
      return { kind: 'emitted', json: JSON.stringify(schema, null, 2) };
    } catch (error) {
      return {
        kind: 'template-invalid',
        templatePath: input.templatePath,
        message: errorMessage(error),
      };
    }
  };
}
