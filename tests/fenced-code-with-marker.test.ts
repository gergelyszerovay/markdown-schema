import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, RootContent } from "mdast";
import { fencedCodeWithMarker } from "../src/index/fenced-code-with-marker";

function parseSection(md: string): RootContent[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(md) as Root;
  return tree.children;
}

describe("fencedCodeWithMarker", () => {
  it("extracts the code block following the marker comment", () => {
    const md = "<!-- prettier-ignore -->\n```ts\nconst x = 1;\n```";
    const result = fencedCodeWithMarker({ marker: /prettier-ignore/ })(
      parseSection(md),
      { section: "S" },
    );
    expect(result).toEqual({ lang: "ts", value: "const x = 1;" });
  });

  it("throws when marker is absent", () => {
    const nodes = parseSection("```ts\nconst x = 1;\n```");
    expect(() =>
      fencedCodeWithMarker({
        marker: /prettier-ignore/,
        markerLabel: "<!-- prettier-ignore -->",
      })(nodes, { section: "Code" }),
    ).toThrow(`Section "Code" must contain <!-- prettier-ignore -->`);
  });

  it("throws when no code block follows the marker", () => {
    const md = "<!-- prettier-ignore -->\n\nSome paragraph instead.";
    expect(() =>
      fencedCodeWithMarker({ marker: /prettier-ignore/ })(parseSection(md), {
        section: "Code",
      }),
    ).toThrow(`code block must follow`);
  });
});
