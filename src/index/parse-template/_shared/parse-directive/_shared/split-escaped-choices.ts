/**
 * Splits a `|`-delimited choice string into individual choices, honouring
 * `\|` (literal `|`) and `\\` (literal `\`) escape sequences.
 *
 * - `\\` → `\`, advance 2
 * - `\|` → `|`, advance 2
 * - `\<other>` → `\` + `<other>`, advance 2 (lenient)
 * - bare `|` → end current choice, start new one
 *
 * Each choice is trimmed; empty choices are dropped.
 *
 * @param input - Raw pipe-separated choice string, e.g. `"A | B \\| C"`.
 * @returns Array of trimmed, non-empty choice strings.
 */
export function splitEscapedChoices(input: string): string[] {
  const choices: string[] = [];
  let current = "";
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === "\\") {
      const next = input[i + 1];
      if (next === "\\") {
        current += "\\";
        i += 2;
      } else if (next === "|") {
        current += "|";
        i += 2;
      } else {
        current += "\\" + (next ?? "");
        i += 2;
      }
    } else if (ch === "|") {
      choices.push(current.trim());
      current = "";
      i++;
    } else {
      current += ch;
      i++;
    }
  }
  choices.push(current.trim());
  return choices.filter(Boolean);
}
