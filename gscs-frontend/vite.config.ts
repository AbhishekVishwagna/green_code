import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const COOP_HEADERS = {
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy":   "same-origin",
};

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: {
    target: "es2022",
    outDir: "dist",
  },
  optimizeDeps: { esbuildOptions: { target: "es2022" } },
  server:  { headers: COOP_HEADERS },
  preview: { headers: COOP_HEADERS },
});
