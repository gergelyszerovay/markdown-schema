import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, RootContent } from "mdast";
import { repeatedWhere } from "../src/index/parse-template/infer-section/repeated/repeated-where";
import { freetext } from "../src/index/parse-template/infer-section/freetext";

function parseSection(md: string): RootContent[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(md) as Root;
  return tree.children;
}

describe("repeatedWhere", () => {
  it("splits by thematic break and extracts each group", () => {
    const md = "---\n\nFirst group.\n\n---\n\nSecond group.";
    const extractor = repeatedWhere({
      startsAt: (n) => n.type === "thematicBreak",
      headingFrom: () => "item",
      shape: { body: freetext },
    });
    const result = extractor(parseSection(md), { section: "S" });
    expect(result).toHaveLength(2);
    expect(result[0].body).toBe("First group.");
    expect(result[1].body).toBe("Second group.");
  });

  it("includes boundary node when includeBoundary is true", () => {
    const md = "---\n\nText.";
    const extractor = repeatedWhere({
      startsAt: (n) => n.type === "thematicBreak",
      headingFrom: () => "g",
      shape: { body: freetext },
      includeBoundary: true,
    });
    const result = extractor(parseSection(md), { section: "S" });
    expect(result).toHaveLength(1);
  });

  it("returns empty array when no boundaries found", () => {
    const md = "Just plain text with no thematic breaks.";
    const extractor = repeatedWhere({
      startsAt: (n) => n.type === "thematicBreak",
      headingFrom: () => "x",
      shape: { body: freetext },
    });
    expect(extractor(parseSection(md), { section: "S" })).toEqual([]);
  });
});
