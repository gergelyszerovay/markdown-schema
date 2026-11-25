import { check, checkSync } from 'recheck';
import { DirectiveError } from './directive.error.ts';

/** Maximum length of a template-supplied regex source, in characters. */
const MAX_REGEX_LENGTH = 200;

/**
 * Highest polynomial backtracking degree tolerated. Exponential blowup (the
 * catastrophic `^(a+)+$` class) is always rejected; low-degree polynomial
 * patterns (e.g. an unanchored `\d+\.\d+`, degree 2) are permitted because the
 * inputs they match are bounded markdown cells/values, so the worst case is a
 * mild quadratic, not a hang.
 */
const MAX_POLYNOMIAL_DEGREE = 2;

/** Most verdicts kept at once; the memo is cleared when it fills, so it stays bounded. */
const MAX_MEMOIZED_VERDICTS = 1024;

/**
 * Static-analysis verdicts by regex source. The analysis is slow (it runs in a worker and blocks
 * on it) and depends on the source alone, so templates that repeat a pattern pay for it once.
 */
const verdicts = new Map<string, ReturnType<typeof checkSync>>();

/** While set, a source without a verdict is collected here and let through, not analysed. */
let collecting: Set<string> | undefined;

/**
 * Runs a compilation in collection mode: every regex source that has no verdict yet is recorded
 * and accepted unchecked, so the caller can analyse them together. The compilation's result must
 * be discarded.
 * @param compile - A synchronous compilation that calls {@link compileUserRegex}.
 * @returns The regex sources the compilation met that have no memoized verdict.
 */
export function collectUnverifiedRegexes(compile: () => void): string[] {
  const found = new Set<string>();
  collecting = found;
  try {
    compile();
  } catch {
    // A failing template is compiled again for real, which reports the error.
  } finally {
    collecting = undefined;
  }
  return [...found];
}

/**
 * Analyses regex sources with `recheck`'s asynchronous check, all at once and without blocking
 * the event loop, and memoizes the verdicts so the next compilation does not analyse them.
 * @param sources - Regex sources; a source that is too long or already has a verdict is skipped.
 * @returns Resolves when every verdict is memoized.
 */
export async function verifyRegexes(sources: readonly string[]): Promise<void> {
  const fresh = [...new Set(sources)].filter(
    (src) => src.length <= MAX_REGEX_LENGTH && !verdicts.has(src),
  );
  const results = await Promise.all(fresh.map((src) => check(src, '')));
  for (const [index, src] of fresh.entries()) {
    const result = results[index];
    if (result === undefined) continue;
    if (verdicts.size >= MAX_MEMOIZED_VERDICTS) verdicts.clear();
    verdicts.set(src, result);
  }
}

/** The verdict handed out in collection mode, whose compilation is discarded. */
const SAFE_PLACEHOLDER = { status: 'safe' } as ReturnType<typeof checkSync>;

/**
 * Analyses a regex source with `recheck`, remembering the verdict.
 * @param src - The raw regex source.
 * @returns The analysis verdict for that source.
 */
function checkMemoized(src: string): ReturnType<typeof checkSync> {
  const known = verdicts.get(src);
  if (known !== undefined) return known;
  if (collecting !== undefined) {
    collecting.add(src);
    return SAFE_PLACEHOLDER;
  }
  const fresh = checkSync(src, '');
  if (verdicts.size >= MAX_MEMOIZED_VERDICTS) verdicts.clear();
  verdicts.set(src, fresh);
  return fresh;
}

/**
 * Safely compiles a regular expression supplied by a template author.
 *
 * Template `regex` modifiers are untrusted input: a `*.template.md` may come
 * from a PR, an upload, or any other party. A naive `new RegExp(src)` lets the
 * author plant a catastrophic-backtracking pattern (ReDoS) that hangs the
 * validator on a crafted document value. This helper is the single choke point
 * for every user-supplied regex — it fails **closed**:
 *
 * 1. Rejects sources longer than {@link MAX_REGEX_LENGTH}.
 * 2. Statically analyses the pattern with `recheck`. Catastrophic (exponential)
 *    backtracking is always refused; low-degree polynomial patterns are
 *    tolerated up to {@link MAX_POLYNOMIAL_DEGREE} (the matched inputs are
 *    bounded markdown cells/values, so a mild quadratic is acceptable).
 *    `unknown`/`error`/`timeout` verdicts are treated as unsafe and refused.
 *    The verdict for a source is memoized, since it depends on the source alone.
 * @param src - The raw regex source from a directive (without delimiters).
 * @param label - Human-readable context for the error message (e.g. the field
 *   or column name the regex belongs to).
 * @returns A compiled {@link RegExp} that is safe to `.test()` against
 *   untrusted input. Throws a {@link DirectiveError} when the pattern is too
 *   long, unsafe, or otherwise uncompilable.
 */
export function compileUserRegex(src: string, label?: string): RegExp {
  const ctx = label ? ` for ${label}` : '';

  if (src.length > MAX_REGEX_LENGTH) {
    throw new DirectiveError(
      `regex${ctx} is too long (${String(src.length)} > ${String(MAX_REGEX_LENGTH)} characters)`,
    );
  }

  const diagnostics = checkMemoized(src);
  if (diagnostics.status === 'vulnerable') {
    // Exponential is always fatal; polynomial is tolerated up to a low degree
    // (matched inputs are bounded markdown values, so a mild quadratic is fine).
    const c = diagnostics.complexity;
    const tolerable = c.type === 'polynomial' && c.degree <= MAX_POLYNOMIAL_DEGREE;
    if (!tolerable) {
      const detail =
        c.type === 'polynomial'
          ? `is super-linear (degree ${String(c.degree)})`
          : 'is vulnerable to catastrophic backtracking (ReDoS)';
      throw new DirectiveError(`regex${ctx} ${detail}: \`${src}\``);
    }
  } else if (diagnostics.status !== 'safe') {
    // "unknown"/"error"/"timeout" → not proven safe, so refuse it. Fail closed.
    throw new DirectiveError(
      `regex${ctx} could not be proven safe (${diagnostics.status}): \`${src}\``,
    );
  }

  try {
    return new RegExp(src);
  } catch (err) {
    throw new DirectiveError(
      `regex${ctx} is invalid: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
