import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: {
    alias:
      command === "serve"
        ? {
            // In dev we point the workspace dependency at source so edits in packages/core
            // participate in Vite's module graph and update the preview immediately.
            "@xhs-md/core": resolve(__dirname, "../../packages/core/src/index.ts")
          }
        : {}
  }
}));
