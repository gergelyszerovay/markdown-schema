import { describe, expect, it } from "vitest";
import { splitEscapedChoices } from "../src/index/parse-template/_shared/parse-directive/_shared/split-escaped-choices";

describe("splitEscapedChoices", () => {
  it("splits plain choices", () => {
    expect(splitEscapedChoices("Alpha | Beta | GA")).toEqual([
      "Alpha",
      "Beta",
      "GA",
    ]);
  });

  it("preserves \\| as literal pipe inside a choice", () => {
    expect(splitEscapedChoices("A \\| B (either) | C")).toEqual([
      "A | B (either)",
      "C",
    ]);
  });

  it("preserves \\\\ as literal backslash inside a choice", () => {
    expect(splitEscapedChoices("A \\\\ D | E")).toEqual(["A \\ D", "E"]);
  });

  it("bare \\x emits backslash + x (lenient)", () => {
    expect(splitEscapedChoices("A \\n B | C")).toEqual(["A \\n B", "C"]);
  });

  it("leading \\| in first choice", () => {
    expect(splitEscapedChoices("\\| A | B")).toEqual(["| A", "B"]);
  });

  it("trailing pipe produces no extra empty choice", () => {
    expect(splitEscapedChoices("A | B |")).toEqual(["A", "B"]);
  });

  it("double pipe drops empty choice between", () => {
    expect(splitEscapedChoices("A || B")).toEqual(["A", "B"]);
  });

  it("trims whitespace from each choice", () => {
    expect(splitEscapedChoices("  A  |  B  ")).toEqual(["A", "B"]);
  });

  it("single choice with no pipe", () => {
    expect(splitEscapedChoices("OnlyOne")).toEqual(["OnlyOne"]);
  });
});
