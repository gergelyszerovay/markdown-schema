#!/usr/bin/env node
// A committed entry for the `validate-md` bin, so package managers can link it before the
// package is built; the CLI itself is the tsdown output in `dist/`.
try {
  await import('../dist/validate-md.main.mjs');
} catch (error) {
  if (
    error?.code !== 'ERR_MODULE_NOT_FOUND' ||
    !String(error.message).includes('validate-md.main.mjs')
  ) {
    throw error;
  }
  process.stderr.write(
    'validate-md: the package is not built yet; run `pnpm turbo run build --filter=markdown-schema`.\n',
  );
  process.exitCode = 1;
}
