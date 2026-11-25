import { makeTextFilesFake } from './text-files.fake.ts';
import { textFilesContract } from './text-files.contract.ts';

textFilesContract('fake', () => {
  const textFiles = makeTextFilesFake();
  return Promise.resolve({
    textFiles,
    pathFor: (name) => `/virtual/${name}`,
    given: (name, content) => {
      textFiles.files.set(`/virtual/${name}`, content);
      return Promise.resolve();
    },
    cleanup: () => Promise.resolve(),
  });
});
