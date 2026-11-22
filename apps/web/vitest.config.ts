import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const shared = fileURLToPath(
  new URL("../../packages/shared/src/index.ts", import.meta.url),
);
const engine = fileURLToPath(
  new URL("../../packages/engine/src/index.ts", import.meta.url),
);

export default defineConfig({
  resolve: {
    alias: {
      "@jsflow/shared": shared,
      "@jsflow/engine": engine,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
