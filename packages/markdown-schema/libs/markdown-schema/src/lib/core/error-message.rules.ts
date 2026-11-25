/**
 * Returns the message of a thrown value: an `Error`'s own message, or the value converted
 * to a string.
 * @param error - The thrown value.
 * @returns The message to show the user.
 */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
