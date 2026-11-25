import type { KeyColumn } from './key-column.model.ts';
import type { RowKey } from './row-key.model.ts';

/**
 * Lists the row keys of a parsed document: for each key column, the value of that column in
 * every row of its section, in document order within a column and template order across them.
 * @param data - The parsed document, keyed by section.
 * @param keyColumns - The template's key columns.
 * @returns The row keys, each with the field of its row.
 */
export function listRowKeys(
  data: Record<string, unknown>,
  keyColumns: readonly KeyColumn[],
): RowKey[] {
  const keys: RowKey[] = [];
  for (const { section, column } of keyColumns) {
    const rows = data[section];
    if (!Array.isArray(rows)) continue;
    for (const row of rows as Record<string, unknown>[]) {
      const value = row[column];
      if (typeof value !== 'string' || value.length === 0) continue;
      keys.push({ key: value, section, column, field: `${section}[${value}]` });
    }
  }
  return keys;
}
