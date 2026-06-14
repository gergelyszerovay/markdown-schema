import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseTemplate } from "../src/index/parse-template";
import { refine } from "../examples/component/component.refine";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fixtureTemplate = (name: string) =>
  readFileSync(path.join(__dirname, "fixtures/templates", name), "utf-8");

const fixture = (name: string) =>
  readFileSync(path.join(__dirname, "fixtures/component-spec", name), "utf-8");

const templateRaw = readFileSync(
  path.join(__dirname, "..", "examples/component/component.template.md"),
  "utf-8",
);
const ComponentDoc = parseTemplate(templateRaw, { refine });

// ---------------------------------------------------------------------------
// Component template — valid paths
// ---------------------------------------------------------------------------

describe("Component template — valid docs", () => {
  it.each(["valid-minimal.md", "valid-full.md", "valid-primitive.md"])(
    "%s parses without errors",
    (file) => {
      expect(() => ComponentDoc.parse(fixture(file))).not.toThrow();
    },
  );
});

// ---------------------------------------------------------------------------
// Component template — invalid paths
// ---------------------------------------------------------------------------

describe("Component template — invalid docs", () => {
  it("bad title → ZodError with title must match message", () => {
    let threw: unknown;
    try {
      ComponentDoc.parse(fixture("invalid-bad-title.md"));
    } catch (e) {
      threw = e;
    }
    expect(threw).toBeInstanceOf(ZodError);
    expect(
      (threw as ZodError).issues.map((i) => i.message).join("\n"),
    ).toContain("title must match");
  });

  it("missing summary → Error with 'Missing required section'", () => {
    let threw: unknown;
    try {
      ComponentDoc.parse(fixture("invalid-missing-summary.md"));
    } catch (e) {
      threw = e;
    }
    expect(threw).toBeInstanceOf(Error);
    expect(threw).not.toBeInstanceOf(ZodError);
    expect((threw as Error).message).toContain("Missing required section");
  });

  it("view with internal state → ZodError from refine", () => {
    let threw: unknown;
    try {
      ComponentDoc.parse(fixture("invalid-view-with-internal-state.md"));
    } catch (e) {
      threw = e;
    }
    expect(threw).toBeInstanceOf(ZodError);
    expect(
      (threw as ZodError).issues.map((i) => i.message).join("\n"),
    ).toContain("View components must not have internal state");
  });

  it("undeclared event → ZodError from refine", () => {
    let threw: unknown;
    try {
      ComponentDoc.parse(fixture("invalid-event-not-declared.md"));
    } catch (e) {
      threw = e;
    }
    expect(threw).toBeInstanceOf(ZodError);
    expect(
      (threw as ZodError).issues.map((i) => i.message).join("\n"),
    ).toContain("onToggle");
  });
});

// ---------------------------------------------------------------------------
// Fixture templates
// ---------------------------------------------------------------------------

describe("enum-only template", () => {
  const schema = parseTemplate(fixtureTemplate("enum-only.template.md"));

  it("accepts valid enum choice", () => {
    expect(() =>
      schema.parse("# Status Report\n\n## 1. Status\n\n- Level: High\n"),
    ).not.toThrow();
  });

  it("rejects invalid enum choice", () => {
    let threw: unknown;
    try {
      schema.parse("# Status Report\n\n## 1. Status\n\n- Level: Extreme\n");
    } catch (e) {
      threw = e;
    }
    expect(threw).toBeInstanceOf(ZodError);
    expect(
      (threw as ZodError).issues.map((i) => i.message).join("\n"),
    ).toContain("Invalid option");
  });
});

describe("table-row template", () => {
  const schema = parseTemplate(fixtureTemplate("table-row.template.md"));

  it("accepts valid table", () => {
    const raw = [
      "# Feature Spec",
      "",
      "## 1. Acceptance Criteria",
      "",
      "| ID | Description | Priority |",
      "| -- | ----------- | -------- |",
      "| AC-001 | First criterion. | High |",
    ].join("\n");
    expect(() => schema.parse(raw)).not.toThrow();
  });

  it("rejects bad ID format", () => {
    const raw = [
      "# Feature Spec",
      "",
      "## 1. Acceptance Criteria",
      "",
      "| ID | Description | Priority |",
      "| -- | ----------- | -------- |",
      "| 001 | Bad ID. | High |",
    ].join("\n");
    let threw: unknown;
    try {
      schema.parse(raw);
    } catch (e) {
      threw = e;
    }
    expect(threw).toBeInstanceOf(ZodError);
    expect(
      (threw as ZodError).issues.map((i) => i.message).join("\n"),
    ).toContain("AC-");
  });
});

describe("section-optional template", () => {
  const schema = parseTemplate(fixtureTemplate("section-optional.template.md"));

  it("accepts doc without optional section", () => {
    const raw = "# Document\n\n## 1. Summary\n\nShort description.\n";
    const doc = schema.parse(raw) as Record<string, unknown>;
    expect(doc["notes"]).toBeUndefined();
  });

  it("accepts doc with optional section", () => {
    const raw = [
      "# Document",
      "",
      "## 1. Summary",
      "",
      "Short description.",
      "",
      "## 2. Notes",
      "",
      "| Key | Value |",
      "| --- | ----- |",
      "| foo | bar |",
    ].join("\n");
    const doc = schema.parse(raw) as Record<string, unknown>;
    expect(Array.isArray(doc["notes"])).toBe(true);
  });
});
