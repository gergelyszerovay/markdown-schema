import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { makeNodeTextFiles } from './node-text-files.gateway.ts';
import { textFilesContract } from '../testing/text-files.contract.ts';
import type { TextFilesHarness } from '../testing/text-files.contract.ts';

textFilesContract('node fs', async (): Promise<TextFilesHarness> => {
  const dir = await mkdtemp(join(tmpdir(), 'md-schema-text-files-'));
  return {
    textFiles: makeNodeTextFiles(),
    pathFor: (name) => join(dir, name),
    given: async (name, content): Promise<void> => {
      await mkdir(dirname(join(dir, name)), { recursive: true });
      await writeFile(join(dir, name), content, 'utf-8');
    },
    cleanup: () => rm(dir, { recursive: true, force: true }),
  };
});
