import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, RootContent } from "mdast";
import { optional } from "../src/index/parse-template/infer-section/optional";
import { table } from "../src/index/parse-template/infer-section/table";

function parseSection(md: string): RootContent[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(md) as Root;
  return tree.children;
}

describe("optional", () => {
  it("returns value when extractor succeeds", () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |";
    const result = optional(table)(parseSection(md), { section: "S" });
    expect(result).toEqual([{ A: "1", B: "2" }]);
  });

  it("returns undefined when extractor throws", () => {
    const nodes = parseSection("No table here.");
    const result = optional(table)(nodes, { section: "S" });
    expect(result).toBeUndefined();
  });
});
