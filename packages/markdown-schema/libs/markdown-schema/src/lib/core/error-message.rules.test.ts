import { describe, expect, it } from 'vitest';
import { errorMessage } from './error-message.rules.ts';

describe('errorMessage', () => {
  it.each([
    { thrown: new Error('boom'), message: 'boom' },
    { thrown: new TypeError('bad type'), message: 'bad type' },
    { thrown: 'plain text', message: 'plain text' },
    { thrown: 42, message: '42' },
    { thrown: undefined, message: 'undefined' },
  ])(
    'shows an Error’s own message and any other thrown value as text ($message)',
    { tags: ['invariant'], meta: { spec: 'error-message-of-a-thrown-value' } },
    ({ thrown, message }) => {
      expect(errorMessage(thrown)).toBe(message);
    },
  );
});
