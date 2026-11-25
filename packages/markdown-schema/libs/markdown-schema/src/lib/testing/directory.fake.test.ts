import { directoryContract } from './directory.contract.ts';
import { makeDirectoryFake } from './directory.fake.ts';

directoryContract('fake', () => {
  const { directory } = makeDirectoryFake(
    ['a.md', 'docs/b.md', 'node_modules/x/c.md', 'docs/node_modules/d.md'],
    { symlinks: ['link.md'] },
  );
  return Promise.resolve({ directory, root: '/virtual', cleanup: () => Promise.resolve() });
});
