import { defineConfig } from "vitest/config";

export default defineConfig({
  optimizeDeps: {
    exclude: [
      "@jsquash/avif",
      "@jsquash/jpeg",
      "@jsquash/jxl",
      "@jsquash/png",
      "@jsquash/webp",
    ],
  },
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        format: "es",
        inlineDynamicImports: true,
      },
    },
  },
  worker: {
    format: "es",
  },
});
