import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, RootContent } from "mdast";
import { taskList } from "../src/index/parse-template/infer-section/task-list";

function parseSection(md: string): RootContent[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(md) as Root;
  return tree.children;
}

describe("taskList", () => {
  it("extracts checked and unchecked items", () => {
    const nodes = parseSection("- [x] Done\n- [ ] Pending");
    expect(taskList(nodes, { section: "S" })).toEqual([
      { checked: true, text: "Done" },
      { checked: false, text: "Pending" },
    ]);
  });

  it("throws when no list is present", () => {
    const nodes = parseSection("No list.");
    expect(() => taskList(nodes, { section: "Tasks" })).toThrow(
      `Section "Tasks" must contain a list`,
    );
  });
});
