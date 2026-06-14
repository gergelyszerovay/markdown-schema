#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import { parseTemplate } from "../src/index/parse-template";
import { loadRefine } from "../src/index/parse-template/load-refine";

const args = process.argv.slice(2);

function printUsage(): void {
  console.error(
    "Usage: validate-md --template <file.template.md> [--emit-json <path>] [--no-refine] <md-file> [<md-file>...]",
  );
}

if (args.length === 0) {
  printUsage();
  process.exit(1);
}

let templateFile: string | undefined;
let emitJsonPath: string | undefined;
let noRefine = false;
const mdFiles: string[] = [];

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--template") {
    templateFile = args[++i];
  } else if (arg === "--emit-json") {
    emitJsonPath = args[++i];
  } else if (arg === "--no-refine") {
    noRefine = true;
  } else if (arg === "--schema" || arg === "--export") {
    console.error(
      "Error: --schema/--export were removed in v0.2.0. Use --template <file.template.md> instead.",
    );
    process.exit(1);
  } else {
    mdFiles.push(arg);
  }
}

if (!templateFile) {
  console.error("Error: --template <file.template.md> is required");
  printUsage();
  process.exit(1);
}

if (mdFiles.length === 0) {
  console.error("Error: at least one markdown file is required");
  printUsage();
  process.exit(1);
}

if (emitJsonPath !== undefined && mdFiles.length !== 1) {
  console.error("Error: --emit-json requires exactly one markdown file");
  process.exit(1);
}

const templatePath = resolve(templateFile);
let templateRaw: string;
try {
  templateRaw = readFileSync(templatePath, "utf-8");
} catch (err) {
  console.error(
    `Error: cannot read template: ${err instanceof Error ? err.message : String(err)}`,
  );
  process.exit(1);
}

// Loading a template's sibling `*.refine.ts` executes arbitrary code from that
// file. When validating untrusted templates, pass --no-refine to skip it (the
// structural + directive schema still runs; only cross-section refine rules are
// dropped).
const refine = noRefine ? undefined : await loadRefine(templatePath);
let schema: { parse(raw: string): unknown };
try {
  schema = parseTemplate(templateRaw, { refine });
} catch (err) {
  // A malformed or malicious template (bad directive, unsafe regex, …) throws
  // before any document is validated. Report it cleanly instead of crashing.
  console.error(
    `Error: invalid template ${templateFile}: ${err instanceof Error ? err.message : String(err)}`,
  );
  process.exit(1);
}

let hasFailure = false;

for (const mdFile of mdFiles) {
  const filePath = resolve(mdFile);
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch (err) {
    console.error(
      `${mdFile}: ${err instanceof Error ? err.message : String(err)}`,
    );
    hasFailure = true;
    continue;
  }

  try {
    const doc = schema.parse(raw);
    if (emitJsonPath !== undefined) {
      const outPath = resolve(emitJsonPath);
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, JSON.stringify(doc, null, 2) + "\n", "utf-8");
      console.error(`${mdFile}: OK (wrote ${emitJsonPath})`);
    } else {
      console.error(`${mdFile}: OK`);
    }
  } catch (err) {
    hasFailure = true;
    if (err instanceof z.ZodError) {
      console.error(`${mdFile}: schema validation failed`);
      for (const issue of err.issues) {
        const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
        console.error(`  - ${path}: ${issue.message}`);
      }
    } else {
      console.error(
        `${mdFile}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

process.exit(hasFailure ? 1 : 0);
