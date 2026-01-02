import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: "src/extension",
  build: {
    outDir: path.resolve(__dirname, "extension"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "src/extension/index.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
