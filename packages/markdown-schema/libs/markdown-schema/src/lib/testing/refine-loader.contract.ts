import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import type { RefineLoader } from '../core/refine-loader.port.ts';

/** The state of a template's companion `*.refine.ts` file, as a contract run arranges it. */
export type Companion =
  | { kind: 'none' }
  | { kind: 'refine'; message: string }
  | { kind: 'no-refine-export' }
  | { kind: 'import-failure'; message: string };

/** What a refine-loader contract run needs from an implementation and its storage. */
export type RefineLoaderHarness = {
  loadRefine: RefineLoader;
  /** Arranges a template and its companion; returns the template's path. */
  given(stem: string, companion: Companion): Promise<string>;
  /** Releases what the harness holds. */
  cleanup(): Promise<void>;
};

/**
 * The contract suite of the refine-loader port: run it against the fake and against every
 * adapter, so they agree on what a missing, empty or broken companion looks like.
 * @param name - The implementation's name, shown in the suite title.
 * @param setUp - Creates a harness with no templates.
 */
export const refineLoaderContract = (
  name: string,
  setUp: () => Promise<RefineLoaderHarness>,
): void => {
  describe(`RefineLoader contract: ${name}`, () => {
    it(
      'returns the refine function a companion exports',
      {
        tags: ['scenario'],
        meta: {
          spec: 'refine-loader-returns-the-refine-export',
          arrange: 'a template with a companion that exports a refine function reporting one issue',
          act: 'the refine function is loaded and run on a document',
          assert: 'it is a function, and running it reports that issue',
        },
      },
      async () => {
        let harness: RefineLoaderHarness;
        let issues: unknown[];
        arrange: {
          harness = await setUp();
          issues = [];
        }
        act: {
          const path = await harness.given('t', { kind: 'refine', message: 'not allowed' });
          const refine = await harness.loadRefine(path);
          const ctx = { addIssue: (issue: unknown): number => issues.push(issue) };
          refine?.({}, ctx as unknown as z.core.$RefinementCtx);
        }
        assert: {
          expect(issues).toEqual([expect.objectContaining({ message: 'not allowed' })]);
          await harness.cleanup();
        }
      },
    );

    it(
      'resolves undefined when the template has no companion file',
      {
        tags: ['edge-case'],
        meta: {
          spec: 'refine-loader-no-companion-resolves-undefined',
          arrange: 'a template without a companion file',
          act: 'its refine function is loaded',
          assert: 'the result is undefined',
        },
      },
      async () => {
        let harness: RefineLoaderHarness;
        let path: string;
        let refine: unknown;
        arrange: {
          harness = await setUp();
          path = await harness.given('t', { kind: 'none' });
        }
        act: {
          refine = await harness.loadRefine(path);
        }
        assert: {
          expect(refine).toBeUndefined();
          await harness.cleanup();
        }
      },
    );

    it(
      'resolves undefined when the companion exports no refine function',
      {
        tags: ['edge-case'],
        meta: {
          spec: 'refine-loader-no-refine-export-resolves-undefined',
          arrange: 'a template whose companion file exports something other than refine',
          act: 'its refine function is loaded',
          assert: 'the result is undefined',
        },
      },
      async () => {
        let harness: RefineLoaderHarness;
        let path: string;
        let refine: unknown;
        arrange: {
          harness = await setUp();
          path = await harness.given('t', { kind: 'no-refine-export' });
        }
        act: {
          refine = await harness.loadRefine(path);
        }
        assert: {
          expect(refine).toBeUndefined();
          await harness.cleanup();
        }
      },
    );

    it(
      'rejects with the import error when the companion fails to load',
      {
        tags: ['edge-case'],
        meta: {
          spec: 'refine-loader-import-failure-rejects',
          arrange: 'a template whose companion file throws when it is imported',
          act: 'its refine function is loaded',
          assert: 'the load rejects with the error the companion threw',
        },
      },
      async () => {
        let harness: RefineLoaderHarness;
        let path: string;
        let outcome: ReturnType<RefineLoader>;
        arrange: {
          harness = await setUp();
          path = await harness.given('t', { kind: 'import-failure', message: 'cannot load' });
        }
        act: {
          outcome = harness.loadRefine(path);
        }
        assert: {
          await expect(outcome).rejects.toThrow('cannot load');
          await harness.cleanup();
        }
      },
    );
  });
};
