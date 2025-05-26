/**
 * PNG encoder for encoding PNG images
 */

import type { Encoder } from "../../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../../utils/environment";

let pngEncodeInitialized = false;

const WASM_PATH = "node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm";

async function initializeEncoder() {
	if (pngEncodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		const { init: initEncode } = await import("@jsquash/png/encode");
		await initEncode(WASM_PATH);
	} else if (isRunningInNode) {
		const [{ init: initEncode }, fs] = await Promise.all([
			import("@jsquash/png/encode"),
			import("node:fs"),
		]);
		const wasmBuffer = fs.readFileSync(WASM_PATH);
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		await initEncode(wasmModule);
	}
	pngEncodeInitialized = true;
}

export function encode(): Encoder {
	return async (image: ImageData) => {
		await initializeEncoder();
		const { default: encode } = await import("@jsquash/png/encode");
		// @ts-expect-error function overload not working
		const data = await encode(image);
		return {
			format: "image/png",
			data,
		};
	};
}
