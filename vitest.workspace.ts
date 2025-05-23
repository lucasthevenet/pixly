import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "vitest.config.ts",
  // {
  //   extends: "vitest.config.ts",
  //   test: {
  //     browser: {
  //       enabled: true,
  //       provider: "playwright",
  //       headless: true,
  //       // https://vitest.dev/guide/browser/playwright
  //       instances: [{ browser: "chromium" }],
  //     },
  //   },
  //   optimizeDeps: {
  //     exclude: [
  //       "@jsquash/avif",
  //       "@jsquash/jpeg",
  //       "@jsquash/jxl",
  //       "@jsquash/png",
  //       "@jsquash/webp",
  //     ],
  //   },
  // },
]);
