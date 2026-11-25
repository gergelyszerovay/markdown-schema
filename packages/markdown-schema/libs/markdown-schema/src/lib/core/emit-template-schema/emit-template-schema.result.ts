/** The outcome of emitting a template's JSON Schema. */
export type EmitTemplateSchemaResult =
  | {
      /** The template compiled; `json` is its JSON Schema, serialized without a trailing newline. */
      kind: 'emitted';
      json: string;
    }
  | {
      /** The template file could not be read. */
      kind: 'template-unreadable';
      message: string;
    }
  | {
      /** The template did not compile. */
      kind: 'template-invalid';
      templatePath: string;
      message: string;
    };
