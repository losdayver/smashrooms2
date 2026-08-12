import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@client": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    target: "es2020",
    outDir: "../static/scripts",
    emptyOutDir: true,
    sourcemap: true,
    rolldownOptions: {
      input: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      output: {
        entryFileNames: "bundle.js",
        chunkFileNames: "[name]-[hash].js",
      },
    },
  },
});
