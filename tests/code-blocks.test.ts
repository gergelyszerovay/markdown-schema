import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, RootContent } from "mdast";
import { codeBlocks } from "../src/index/code-blocks";

function parseSection(md: string): RootContent[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(md) as Root;
  return tree.children;
}

describe("codeBlocks", () => {
  it("collects all fenced code blocks with language and value", () => {
    const md = "```ts\nconst x = 1;\n```\n\n```js\nconsole.log();\n```";
    const blocks = codeBlocks(parseSection(md), { section: "S" });
    expect(blocks).toEqual([
      { lang: "ts", value: "const x = 1;" },
      { lang: "js", value: "console.log();" },
    ]);
  });

  it("yields null lang for unlabeled blocks", () => {
    const nodes = parseSection("```\nplain\n```");
    expect(codeBlocks(nodes, { section: "S" })).toEqual([
      { lang: null, value: "plain" },
    ]);
  });

  it("returns empty array when no code blocks", () => {
    const nodes = parseSection("Just text.");
    expect(codeBlocks(nodes, { section: "S" })).toEqual([]);
  });
});
