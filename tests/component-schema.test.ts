import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseTemplate } from "../src/index/parse-template";
import { refine } from "../examples/component/component.refine";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const templatePath = path.join(
  __dirname,
  "..",
  "examples/component/component.template.md",
);
const templateRaw = readFileSync(templatePath, "utf-8");
const ComponentDoc = parseTemplate(templateRaw, { refine });

const fixture = (name: string) =>
  readFileSync(path.join(__dirname, "fixtures/component-spec", name), "utf8");

const example = (name: string) =>
  readFileSync(path.join(__dirname, "..", "examples/component", name), "utf8");

// ---------------------------------------------------------------------------
// Valid fixtures
// ---------------------------------------------------------------------------

type ValidAssertion = {
  title: string;
  classificationType: string;
  inputsLength: number;
  visualStatesLength: number;
  hasSlots?: boolean;
  hasInternalState?: boolean;
  sourceValue?: string;
};

const validTable: [string, ValidAssertion][] = [
  [
    "valid-minimal.md",
    {
      title: "Component Spec: Badge",
      classificationType: "View",
      inputsLength: 1,
      visualStatesLength: 1,
    },
  ],
  [
    "valid-full.md",
    {
      title: "Component Spec: Button",
      classificationType: "View",
      inputsLength: 4,
      visualStatesLength: 5,
      hasSlots: true,
    },
  ],
  [
    "valid-primitive.md",
    {
      title: "Component Spec: Input",
      classificationType: "Primitive",
      inputsLength: 2,
      visualStatesLength: 2,
      sourceValue: "shadcn",
    },
  ],
];

describe("ComponentDoc — valid fixtures", () => {
  it.each(validTable)("%s parses successfully", (file, assertions) => {
    const doc = ComponentDoc.parse(fixture(file)) as Record<string, unknown>;

    expect(doc["title"]).toBe(assertions.title);
    const classification = doc["classification"] as Record<
      string,
      string | undefined
    >;
    expect(classification["Type"]).toBe(assertions.classificationType);
    expect((doc["inputs"] as unknown[]).length).toBe(assertions.inputsLength);
    expect((doc["visualStates"] as unknown[]).length).toBe(
      assertions.visualStatesLength,
    );

    if (assertions.hasSlots) {
      expect(doc["slots"]).toBeDefined();
      expect(Array.isArray(doc["slots"])).toBe(true);
    } else {
      expect(doc["slots"]).toBeUndefined();
    }

    if (assertions.hasInternalState) {
      expect(doc["internalState"]).toBeDefined();
      expect(Array.isArray(doc["internalState"])).toBe(true);
    }

    if (assertions.sourceValue !== undefined) {
      expect(classification["Source"]).toBe(assertions.sourceValue);
    }
  });
});

// ---------------------------------------------------------------------------
// Invalid fixtures
// ---------------------------------------------------------------------------

type InvalidAssertion =
  | { kind: "Error"; messageFragment: string }
  | { kind: "ZodError"; messageFragment: string };

const invalidTable: [string, InvalidAssertion][] = [
  [
    "invalid-bad-title.md",
    { kind: "ZodError", messageFragment: "title must match" },
  ],
  [
    "invalid-missing-summary.md",
    { kind: "Error", messageFragment: "Missing required section" },
  ],
  [
    "invalid-missing-props-table.md",
    { kind: "Error", messageFragment: "must contain a table" },
  ],
  [
    "invalid-bad-classification-type.md",
    { kind: "ZodError", messageFragment: "Invalid option" },
  ],
  [
    "invalid-view-with-internal-state.md",
    {
      kind: "ZodError",
      messageFragment: "View components must not have internal state",
    },
  ],
  [
    "invalid-event-not-declared.md",
    { kind: "ZodError", messageFragment: "onToggle" },
  ],
  [
    "invalid-source-on-non-primitive.md",
    {
      kind: "ZodError",
      messageFragment: "Source is only allowed for Primitive",
    },
  ],
  [
    "invalid-empty-visual-states.md",
    { kind: "ZodError", messageFragment: "Too small" },
  ],
  [
    "invalid-bad-required-flag.md",
    { kind: "ZodError", messageFragment: "Invalid option" },
  ],
];

describe("ComponentDoc — invalid fixtures", () => {
  it.each(invalidTable)("%s throws expected error", (file, assertion) => {
    let threw: unknown;
    try {
      ComponentDoc.parse(fixture(file));
    } catch (e) {
      threw = e;
    }

    expect(threw).toBeDefined();

    if (assertion.kind === "ZodError") {
      expect(threw).toBeInstanceOf(ZodError);
      const allMessages = (threw as ZodError).issues
        .map((i) => i.message)
        .join("\n");
      expect(allMessages).toContain(assertion.messageFragment);
    } else {
      expect(threw).toBeInstanceOf(Error);
      expect(threw).not.toBeInstanceOf(ZodError);
      expect((threw as Error).message).toContain(assertion.messageFragment);
    }
  });
});

// ---------------------------------------------------------------------------
// Snapshot — published example
// ---------------------------------------------------------------------------

describe("ComponentDoc — example.md snapshot", () => {
  it("parses examples/component/example.md and matches snapshot", () => {
    const doc = ComponentDoc.parse(example("example.md"));
    expect(doc).toMatchSnapshot();
  });
});
