import { checkSync } from "recheck";
import { DirectiveError } from "./directive-error";

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
 * 2. Statically analyses the pattern with `recheck` and rejects anything not
 *    proven to run in linear time (`status !== "safe"`), so vulnerable and
 *    unknown patterns are both refused rather than compiled.
 *
 * @param src - The raw regex source from a directive (without delimiters).
 * @param label - Human-readable context for the error message (e.g. the field
 *   or column name the regex belongs to).
 * @returns A compiled {@link RegExp} that is safe to `.test()` against
 *   untrusted input.
 * @throws DirectiveError when the pattern is too long, unsafe, or otherwise
 *   uncompilable.
 */
export function compileUserRegex(src: string, label?: string): RegExp {
  const ctx = label ? ` for ${label}` : "";

  if (src.length > MAX_REGEX_LENGTH) {
    throw new DirectiveError(
      `regex${ctx} is too long (${src.length} > ${MAX_REGEX_LENGTH} characters)`,
    );
  }

  const diagnostics = checkSync(src, "");
  if (diagnostics.status === "vulnerable") {
    // Exponential is always fatal; polynomial is tolerated up to a low degree
    // (matched inputs are bounded markdown values, so a mild quadratic is fine).
    const c = diagnostics.complexity;
    const tolerable =
      c?.type === "polynomial" && c.degree <= MAX_POLYNOMIAL_DEGREE;
    if (!tolerable) {
      const detail =
        c?.type === "polynomial"
          ? `is super-linear (degree ${c.degree})`
          : "is vulnerable to catastrophic backtracking (ReDoS)";
      throw new DirectiveError(`regex${ctx} ${detail}: \`${src}\``);
    }
  } else if (diagnostics.status !== "safe") {
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
