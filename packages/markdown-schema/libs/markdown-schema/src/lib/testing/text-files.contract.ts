import { describe, expect, it } from 'vitest';
import type { TextFiles } from '../core/text-files.port.ts';

/** What a text-files contract run needs from an implementation and its storage. */
export type TextFilesHarness = {
  textFiles: TextFiles;
  /** A path inside the implementation's storage for a file name. */
  pathFor(name: string): string;
  /** Puts a file in storage before the act. */
  given(name: string, content: string): Promise<void>;
  /** Releases what the harness holds. */
  cleanup(): Promise<void>;
};

/**
 * The contract suite of the text-files port: run it against the fake and against every
 * adapter, so they agree on reading, writing and failing.
 * @param name - The implementation's name, shown in the suite title.
 * @param setUp - Creates a harness with empty storage.
 */
export const textFilesContract = (name: string, setUp: () => Promise<TextFilesHarness>): void => {
  describe(`TextFiles contract: ${name}`, () => {
    it(
      'reads the contents of an existing file',
      {
        tags: ['scenario'],
        meta: {
          spec: 'text-files-read-returns-contents',
          arrange: 'a file holding some text, including non-ASCII characters',
          act: 'the file is read',
          assert: 'the contents come back unchanged',
        },
      },
      async () => {
        let harness: TextFilesHarness;
        let content: string;
        arrange: {
          harness = await setUp();
          await harness.given('doc.md', '# Title\n\nÁrvíztűrő tükörfúrógép\n');
        }
        act: {
          content = await harness.textFiles.read(harness.pathFor('doc.md'));
        }
        assert: {
          expect(content).toBe('# Title\n\nÁrvíztűrő tükörfúrógép\n');
          await harness.cleanup();
        }
      },
    );

    it(
      'rejects reading a file that does not exist',
      {
        tags: ['edge-case'],
        meta: {
          spec: 'text-files-read-missing-file-rejects',
          arrange: 'empty storage',
          act: 'a file is read',
          assert: 'the read rejects with an error whose message names the file',
        },
      },
      async () => {
        let harness: TextFilesHarness;
        let outcome: Promise<string>;
        arrange: {
          harness = await setUp();
        }
        act: {
          outcome = harness.textFiles.read(harness.pathFor('missing.md'));
        }
        assert: {
          await expect(outcome).rejects.toThrow('missing.md');
          await harness.cleanup();
        }
      },
    );

    it(
      'writes a file below directories that do not exist yet, and reads it back',
      {
        tags: ['scenario'],
        meta: {
          spec: 'text-files-write-creates-missing-directories',
          arrange: 'empty storage',
          act: 'text is written to a file two directories deep',
          assert: 'reading the file returns the text',
        },
      },
      async () => {
        let harness: TextFilesHarness;
        let path: string;
        arrange: {
          harness = await setUp();
          path = harness.pathFor('nested/deeper/out.json');
        }
        act: {
          await harness.textFiles.write(path, '{"a":1}\n');
        }
        assert: {
          expect(await harness.textFiles.read(path)).toBe('{"a":1}\n');
          await harness.cleanup();
        }
      },
    );

    it(
      'replaces the contents of a file that exists',
      {
        tags: ['scenario'],
        meta: {
          spec: 'text-files-write-replaces-contents',
          arrange: 'a file holding some text',
          act: 'other text is written to the same path',
          assert: 'reading the file returns only the new text',
        },
      },
      async () => {
        let harness: TextFilesHarness;
        arrange: {
          harness = await setUp();
          await harness.given('out.json', 'old and longer content');
        }
        act: {
          await harness.textFiles.write(harness.pathFor('out.json'), 'new');
        }
        assert: {
          expect(await harness.textFiles.read(harness.pathFor('out.json'))).toBe('new');
          await harness.cleanup();
        }
      },
    );
  });
};
