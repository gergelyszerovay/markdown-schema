import { createValidateMd } from './validate-md.composition.ts';

process.exitCode = await createValidateMd()(process.argv.slice(2));
