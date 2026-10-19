import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // The real package throws outside of a React Server Components build
      "server-only": fileURLToPath(new URL("./test/empty.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globalSetup: ["test/global-setup.ts"],
    env: { DATABASE_URL: "file:data/test.db" },
    // Integration tests share one SQLite file, so don't run files in parallel
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/app/actions.ts", "src/db/queries.ts"],
      reporter: ["text", "json-summary", "html"],
      thresholds: { lines: 90, branches: 85, functions: 90 },
    },
  },
});
