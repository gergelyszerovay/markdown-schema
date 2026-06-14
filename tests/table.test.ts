import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, RootContent } from "mdast";
import { table } from "../src/index/parse-template/infer-section/table";

function parseSection(md: string): RootContent[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(md) as Root;
  return tree.children;
}

describe("table", () => {
  it("parses header and body rows into objects", () => {
    const md = `| Name | Age |\n|------|-----|\n| Alice | 30 |\n| Bob | 25 |`;
    const rows = table(parseSection(md), { section: "S" });
    expect(rows).toEqual([
      { Name: "Alice", Age: "30" },
      { Name: "Bob", Age: "25" },
    ]);
  });

  it("throws when no table is present", () => {
    const nodes = parseSection("Just some text.");
    expect(() => table(nodes, { section: "My Section" })).toThrow(
      `Section "My Section" must contain a table`,
    );
  });
});
