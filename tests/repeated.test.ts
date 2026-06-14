import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, RootContent } from "mdast";
import { repeated } from "../src/index/parse-template/infer-section/repeated";
import { freetext } from "../src/index/parse-template/infer-section/freetext";
import { table } from "../src/index/parse-template/infer-section/table";

function parseSection(md: string): RootContent[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(md) as Root;
  return tree.children;
}

describe("repeated", () => {
  it("splits by H3 headings and extracts each group", () => {
    const md = [
      "### Alpha",
      "",
      "First description.",
      "",
      "### Beta",
      "",
      "Second description.",
    ].join("\n");
    const extractor = repeated({ by: 3, shape: { description: freetext } });
    const result = extractor(parseSection(md), { section: "S" });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      heading: "Alpha",
      description: "First description.",
    });
    expect(result[1]).toEqual({
      heading: "Beta",
      description: "Second description.",
    });
  });

  it("auto-detects heading depth when by is omitted", () => {
    const md = "### One\n\nText one.\n\n### Two\n\nText two.";
    const extractor = repeated({ shape: { description: freetext } });
    const result = extractor(parseSection(md), { section: "S" });
    expect(result).toHaveLength(2);
    expect(result[0].heading).toBe("One");
    expect(result[1].heading).toBe("Two");
  });

  it("pins to first heading depth and treats deeper headings as body content", () => {
    const md = [
      "### Group A",
      "",
      "#### Not a boundary",
      "",
      "Body text.",
      "",
      "### Group B",
      "",
      "More text.",
    ].join("\n");
    const extractor = repeated({ shape: { description: freetext } });
    const result = extractor(parseSection(md), { section: "S" });
    expect(result).toHaveLength(2);
    expect(result[0].heading).toBe("Group A");
    expect(result[1].heading).toBe("Group B");
  });

  it("includes table extraction in groups", () => {
    const md = [
      "### EP",
      "",
      "Desc.",
      "",
      "| Param | Type |",
      "|-------|------|",
      "| id    | str  |",
    ].join("\n");
    const extractor = repeated({
      shape: { description: freetext, params: table },
    });
    const result = extractor(parseSection(md), { section: "S" });
    expect(result[0].params).toEqual([{ Param: "id", Type: "str" }]);
  });
});
