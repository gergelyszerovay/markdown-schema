import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, RootContent } from "mdast";
import { bulletList } from "../src/index/parse-template/infer-section/bullet-list";

function parseSection(md: string): RootContent[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(md) as Root;
  return tree.children;
}

describe("bulletList", () => {
  it("extracts list items as strings", () => {
    const nodes = parseSection("- Alpha\n- Beta\n- Gamma");
    expect(bulletList(nodes, { section: "S" })).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);
  });

  it("throws when no list is present", () => {
    const nodes = parseSection("No list here.");
    expect(() => bulletList(nodes, { section: "Items" })).toThrow(
      `Section "Items" must contain a list`,
    );
  });
});
