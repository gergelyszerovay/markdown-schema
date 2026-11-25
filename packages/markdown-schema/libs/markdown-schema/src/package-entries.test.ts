import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * The names markdown-schema's `.` entry exports as values: 0.3.0's, plus `listRowKeys` (0.4.0),
 * the binding conventions (0.5.0), `templateJsonSchema` (0.8.0) and the generators
 * `generateDocument` and `generateSkeleton` (0.9.0).
 */
const mainEntryValues = [
  'bindDocuments',
  'bulletList',
  'cellText',
  'codeBlocks',
  'defineDocSchema',
  'fencedCodeWithMarker',
  'freetext',
  'generateDocument',
  'generateSkeleton',
  'headingToKey',
  'legacyTemplateFolderName',
  'listFilePaths',
  'listRowKeys',
  'listTemplates',
  'optional',
  'parseTemplate',
  'parseTemplateAsync',
  'rawNodes',
  'repeated',
  'repeatedWhere',
  'table',
  'taskList',
  'templateFolderName',
  'templateFolderNames',
  'templateJsonSchema',
  'templateNameOf',
];

/** The exports that are values other than functions: the template folder names. */
const constantValues = ['legacyTemplateFolderName', 'templateFolderName', 'templateFolderNames'];

/**
 * Follows the relative imports and re-exports of a source file and returns every specifier
 * the files reached import.
 * @param entry - The absolute path of the starting file.
 * @returns The distinct import specifiers, sorted.
 */
function reachableSpecifiers(entry: string): string[] {
  const specifiers = new Set<string>();
  const visited = new Set<string>();
  const visit = (file: string): void => {
    if (visited.has(file)) return;
    visited.add(file);
    const source = readFileSync(file, 'utf-8');
    for (const match of source.matchAll(
      /^\s*(?:import|export)\b[^;]*?\bfrom\s+['"]([^'"]+)['"]/gm,
    )) {
      const specifier = match[1];
      if (specifier === undefined) continue;
      specifiers.add(specifier);
      if (specifier.startsWith('.')) visit(resolve(dirname(file), specifier));
    }
  };
  visit(entry);
  return [...specifiers].sort();
}

describe('the published entries', () => {
  it(
    'the . entry exports exactly the pinned value list (0.3.0 plus the later additions)',
    {
      tags: ['invariant'],
      meta: { spec: 'published-main-entry-export-list' },
    },
    async () => {
      const entry = await import('./package.entry.ts');
      expect(Object.keys(entry).sort()).toEqual(mainEntryValues);
      for (const name of mainEntryValues) {
        if (constantValues.includes(name)) continue;
        expect(typeof entry[name as keyof typeof entry]).toBe('function');
      }
    },
  );

  it(
    'the ./node entry exports exactly loadRefine',
    {
      tags: ['invariant'],
      meta: { spec: 'published-node-entry-export-list' },
    },
    async () => {
      const entry = await import('./package-node.entry.ts');
      expect(Object.keys(entry)).toEqual(['loadRefine']);
      expect(typeof entry.loadRefine).toBe('function');
    },
  );

  it(
    'nothing the . entry reaches imports a Node built-in',
    {
      tags: ['invariant'],
      meta: { spec: 'published-main-entry-is-browser-safe' },
    },
    () => {
      const specifiers = reachableSpecifiers(resolve(here, 'package.entry.ts'));
      expect(specifiers.filter((specifier) => specifier.startsWith('node:'))).toEqual([]);
      expect(specifiers.length).toBeGreaterThan(10);
    },
  );

  it(
    'the ./node entry reaches the node built-ins that loadRefine needs',
    {
      tags: ['invariant'],
      meta: { spec: 'published-node-entry-reaches-node-builtins' },
    },
    () => {
      const specifiers = reachableSpecifiers(resolve(here, 'package-node.entry.ts'));
      expect(specifiers.filter((specifier) => specifier.startsWith('node:'))).toEqual([
        'node:fs',
        'node:path',
        'node:url',
      ]);
    },
  );

  // The build is a precondition, not a step, and a missing one fails the spec instead of skipping
  // it: a skipped check disappears silently when `test` runs before `build` has written `dist/`.
  // The package's `turbo.json` makes `test` depend on `build`; a plain `vitest run` outside Turbo
  // needs the package built first, as the cage package spec does.
  const builtMain = resolve(here, '../../../dist/index.mjs');
  it(
    'the built . bundle and the chunks it imports contain no Node built-in import',
    {
      tags: ['invariant'],
      meta: { spec: 'built-main-bundle-is-browser-safe' },
    },
    () => {
      expect(
        existsSync(builtMain),
        'the package is not built; run its `build` task first, or run `test` through Turbo',
      ).toBe(true);
      const specifiers = reachableSpecifiers(builtMain);
      expect(specifiers.filter((specifier) => specifier.startsWith('node:'))).toEqual([]);
    },
  );
});
