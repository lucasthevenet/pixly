import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts"],
	unbundle: true,
	platform: "neutral",
	external: ["node:fs"],
});
