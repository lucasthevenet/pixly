import decode, { init as initDecode } from "@jsquash/png/decode";
import encode, { init as initEncode } from "@jsquash/png/encode";
import type { ImageHandler } from "../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../utils/environment";

const PNG_WASM = "node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm";

export const PngHandler: ImageHandler = {
	async decode(buffer) {
		if (isRunningInCloudFlareWorkers) {
			await initDecode(PNG_WASM);
		}
		if (isRunningInNode) {
			const fs = await import("node:fs");
			const pngWasmBuffer = fs.readFileSync(PNG_WASM);
			const pngWasmModule = await WebAssembly.compile(pngWasmBuffer);
			await initDecode(pngWasmModule);
		}

		return decode(buffer, {});
	},
	async encode(image) {
		if (isRunningInCloudFlareWorkers) {
			await initEncode(PNG_WASM);
		}

		if (isRunningInNode) {
			const fs = await import("node:fs");
			const pngWasmBuffer = fs.readFileSync(PNG_WASM);
			const pngWasmModule = await WebAssembly.compile(pngWasmBuffer);
			await initEncode(pngWasmModule);
		}

		// @ts-expect-error function overload not working
		return encode(image);
	},
};
