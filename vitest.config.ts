import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "markdown-schema": path.resolve(
        __dirname,
        "src/index.ts",
      ),
    },
  },
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "**/tests/fixtures/**"],
  },
});
