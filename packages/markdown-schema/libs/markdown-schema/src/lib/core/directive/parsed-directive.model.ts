import type { ColumnSpec } from './column-spec.model.ts';

/**
 * Discriminated union of all recognised `<!-- TEMPLATE-ONLY: ... -->` directive
 * payloads returned by `parseDirective`.
 */
export type ParsedDirective =
  | { kind: 'enum'; choices: string[]; required: boolean }
  | {
      kind: 'field';
      required: boolean;
      regex?: string;
      defaultValue?: string;
      onlyIf?: { key: string; value: string };
    }
  | {
      kind: 'row';
      columns: Record<string, ColumnSpec>;
      minRows?: number;
      maxRows?: number;
      sectionOptional?: boolean;
    }
  | {
      kind: 'section';
      optional?: boolean;
      removeIf?: { key: string; value: string };
      minGroups?: number;
      maxGroups?: number;
      minItems?: number;
      maxItems?: number;
      itemRegex?: string;
    }
  | { kind: 'guide' }
  | { kind: 'document'; open: boolean; unordered: boolean }
  | { kind: 'freetext'; optional: boolean };
