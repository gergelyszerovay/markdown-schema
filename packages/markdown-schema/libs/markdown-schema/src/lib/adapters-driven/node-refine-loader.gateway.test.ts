import { describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadRefine } from './node-refine-loader.gateway.ts';
import { refineLoaderContract } from '../testing/refine-loader.contract.ts';
import type { RefineLoaderHarness } from '../testing/refine-loader.contract.ts';

refineLoaderContract('node import', async (): Promise<RefineLoaderHarness> => {
  const dir = await mkdtemp(join(tmpdir(), 'md-schema-refine-'));
  return {
    loadRefine,
    given: async (stem, companion): Promise<string> => {
      const template = join(dir, `${stem}.template.md`);
      await writeFile(template, '# T\n', 'utf-8');
      const companionSource = {
        none: undefined,
        refine: `export const refine = (_doc, ctx) => { ctx.addIssue({ code: 'custom', message: ${JSON.stringify(companion.kind === 'refine' ? companion.message : '')} }); };\n`,
        'no-refine-export': 'export const other = 1;\n',
        'import-failure': `throw new Error(${JSON.stringify(companion.kind === 'import-failure' ? companion.message : '')});\n`,
      }[companion.kind];
      if (companionSource !== undefined) {
        await writeFile(join(dir, `${stem}.refine.ts`), companionSource, 'utf-8');
      }
      return template;
    },
    cleanup: () => rm(dir, { recursive: true, force: true }),
  };
});

describe('loadRefine: compiled companion', () => {
  it(
    'loads a <stem>.refine.js when there is no <stem>.refine.ts',
    {
      tags: ['scenario'],
      meta: {
        spec: 'node-refine-loader-loads-refine-js',
        arrange: 'a template whose only companion is a compiled .refine.js',
        act: 'the refine function is loaded',
        assert: 'it is the js file’s refine export',
      },
    },
    async () => {
      let dir: string;
      let template: string;
      arrange: {
        dir = await mkdtemp(join(tmpdir(), 'md-schema-refine-js-'));
        template = join(dir, 't.template.md');
        await writeFile(template, '# T\n', 'utf-8');
        await writeFile(join(dir, 't.refine.js'), 'export const refine = () => {};\n', 'utf-8');
      }
      let refine: Awaited<ReturnType<typeof loadRefine>>;
      act: {
        refine = await loadRefine(template);
      }
      assert: {
        expect(typeof refine).toBe('function');
        await rm(dir, { recursive: true, force: true });
      }
    },
  );

  it(
    'loads a <stem>.refine.mjs when there is neither a .refine.ts nor a .refine.js',
    {
      tags: ['scenario'],
      meta: {
        spec: 'node-refine-loader-loads-refine-mjs',
        arrange: 'a template whose only companion is a compiled .refine.mjs',
        act: 'the refine function is loaded',
        assert: 'it is the mjs file’s refine export',
      },
    },
    async () => {
      let dir: string;
      let template: string;
      arrange: {
        dir = await mkdtemp(join(tmpdir(), 'md-schema-refine-mjs-'));
        template = join(dir, 't.template.md');
        await writeFile(template, '# T\n', 'utf-8');
        await writeFile(join(dir, 't.refine.mjs'), 'export const refine = () => {};\n', 'utf-8');
      }
      let refine: Awaited<ReturnType<typeof loadRefine>>;
      act: {
        refine = await loadRefine(template);
      }
      assert: {
        expect(typeof refine).toBe('function');
        await rm(dir, { recursive: true, force: true });
      }
    },
  );
});
