import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, RootContent } from "mdast";
import { freetext } from "./freetext";

function parseSection(md: string): RootContent[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(md) as Root;
  return tree.children;
}

const ctx = { section: "Test" };

describe("freetext extractor", () => {
  it("round-trips a paragraph", () => {
    const nodes = parseSection("Hello world.");
    const result = freetext(nodes, ctx);
    expect(result).toBe("Hello world.");
  });

  it("round-trips paragraph + fenced code block", () => {
    const md = "Intro.\n\n```ts\nconst x = 1;\n```";
    const nodes = parseSection(md);
    const result = freetext(nodes, ctx);
    expect(result).toContain("Intro.");
    expect(result).toContain("```ts");
    expect(result).toContain("const x = 1;");
  });

  it("round-trips a GFM table", () => {
    const md = "| A | B |\n| --- | --- |\n| 1 | 2 |";
    const nodes = parseSection(md);
    const result = freetext(nodes, ctx);
    expect(result).toContain("| A |");
    expect(result).toContain("| 1 |");
  });

  it("round-trips a bullet list", () => {
    const md = "- item one\n- item two";
    const nodes = parseSection(md);
    const result = freetext(nodes, ctx);
    expect(result).toContain("item one");
    expect(result).toContain("item two");
  });

  it("round-trips a blockquote", () => {
    const md = "> quoted text";
    const nodes = parseSection(md);
    const result = freetext(nodes, ctx);
    expect(result).toContain("> quoted text");
  });

  it("round-trips a thematic break", () => {
    const md = "Before.\n\n---\n\nAfter.";
    const nodes = parseSection(md);
    const result = freetext(nodes, ctx);
    // toMarkdown normalizes --- to *** (its default thematic break form)
    expect(result).toMatch(/^[\*\-]{3,}$/m);
    expect(result).toContain("Before.");
    expect(result).toContain("After.");
  });

  it("round-trips H3+ headings", () => {
    const md = "### Sub-heading\n\nSome text.";
    const nodes = parseSection(md);
    const result = freetext(nodes, ctx);
    expect(result).toContain("### Sub-heading");
    expect(result).toContain("Some text.");
  });

  it("throws when a top-level guide directive is in the body", () => {
    const nodes = parseSection(
      "Some prose.\n<!-- TEMPLATE-ONLY: guide\n// stray guide\n-->",
    );
    expect(() => freetext(nodes, ctx)).toThrow(
      "free-text bodies cannot contain TEMPLATE-ONLY directives",
    );
  });

  it("throws when an inline directive is nested inside a paragraph", () => {
    const nodes = parseSection(
      "Value: <!-- TEMPLATE-ONLY: string; required -->",
    );
    expect(() => freetext(nodes, ctx)).toThrow(
      "free-text bodies cannot contain TEMPLATE-ONLY directives",
    );
  });
});
