import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";

const shared = fileURLToPath(
  new URL("../../packages/shared/src/index.ts", import.meta.url),
);
const engine = fileURLToPath(
  new URL("../../packages/engine/src/index.ts", import.meta.url),
);

export default defineConfig({
  plugins: [react(), tailwindcss(), checker({ typescript: true })],
  resolve: {
    alias: {
      "@jsflow/shared": shared,
      "@jsflow/engine": engine,
    },
  },
  server: {
    proxy: {
      "/api": { target: "http://localhost:5000", changeOrigin: true },
    },
  },
});
