import type { z } from 'zod';
import { makeRefineLoaderFake } from './refine-loader.fake.ts';
import { refineLoaderContract } from './refine-loader.contract.ts';

refineLoaderContract('fake', () => {
  const fake = makeRefineLoaderFake();
  return Promise.resolve({
    loadRefine: fake.loadRefine,
    given: (stem, companion) => {
      const path = `/virtual/${stem}.template.md`;
      if (companion.kind === 'refine') {
        fake.givenRefine(path, (_doc: unknown, ctx: z.core.$RefinementCtx): void => {
          ctx.addIssue({ code: 'custom', message: companion.message });
        });
      } else if (companion.kind === 'import-failure') {
        fake.givenImportFailure(path, new Error(companion.message));
      }
      return Promise.resolve(path);
    },
    cleanup: () => Promise.resolve(),
  });
});
