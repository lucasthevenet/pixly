import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    workspace: [
      {
        test: {
          name: "node",
          environment: "node",
        },
      },
      {
        test: {
          name: "edge",
          environment: "edge-runtime",
        },
      },
      {
        test: {
          name: "browser",
          browser: {
            enabled: true,
            provider: "playwright",
            headless: true,
            screenshotFailures: false,
            // https://vitest.dev/guide/browser/playwright
            instances: [{ browser: "chromium" }],
          },
        },
        optimizeDeps: {
          exclude: [
            "@jsquash/avif",
            "@jsquash/jpeg",
            "@jsquash/jxl",
            "@jsquash/png",
            "@jsquash/webp",
            "@jsquash/resize",
          ],
        },
      },
    ],
  },
});
