import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    node: "src/node.ts",
    "bin/validate-md": "bin/validate-md.ts",
  },
  format: ["esm"],
  target: "node22",
  outDir: "dist",
  dts: { entry: { index: "src/index.ts", node: "src/node.ts" } },
  sourcemap: true,
  clean: true,
  splitting: false,
  shims: false,
});
