import { cleanPath } from './clean-path.rules.ts';

/**
 * Cleans a file list into a set: each path is cleaned, and an unusable one is dropped.
 * @param paths - Root-relative POSIX file paths as the caller wrote them.
 * @returns The cleaned paths.
 */
export function cleanFileSet(paths: readonly string[]): Set<string> {
  const files = new Set<string>();
  for (const path of paths) {
    const segments = cleanPath(path);
    if (segments !== null) files.add(segments.join('/'));
  }
  return files;
}
