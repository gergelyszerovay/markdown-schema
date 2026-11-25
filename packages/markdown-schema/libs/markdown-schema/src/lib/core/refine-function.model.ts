import type { z } from 'zod';

/** Signature of the `refine` export in a `*.refine.ts` companion file. */
export type RefineFunction = (doc: unknown, ctx: z.core.$RefinementCtx) => void;
