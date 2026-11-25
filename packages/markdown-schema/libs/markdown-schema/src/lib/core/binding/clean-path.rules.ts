/**
 * Cleans a path: backslashes become slashes, empty and `.` segments go, and a path that
 * climbs out with `..` is refused.
 * @param path - A path as the caller wrote it.
 * @returns The path as `/`-separated segments, or `null` when it is unusable.
 */
export function cleanPath(path: string): string[] | null {
  const segments = path.replaceAll('\\', '/').split('/');
  const kept = segments.filter((segment) => segment !== '' && segment !== '.');
  if (kept.length === 0 || kept.includes('..')) return null;
  return kept;
}
