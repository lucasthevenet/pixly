/**
 * WebP encoder for encoding WebP images
 */

import type { EncodeOptions } from "@jsquash/webp/meta";
import type { Encoder } from "../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../utils/environment";

let webpEncodeInitialized = false;

const ENCODE_WASM_PATH = "node_modules/@jsquash/webp/codec/enc/webp_enc.wasm";

async function initializeEncoder() {
	if (webpEncodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		const { init: initEncode } = await import("@jsquash/webp/encode");
		await initEncode(ENCODE_WASM_PATH);
	} else if (isRunningInNode) {
		const [{ init: initEncode }, fs] = await Promise.all([
			import("@jsquash/webp/encode"),
			import("node:fs"),
		]);
		const wasmBuffer = fs.readFileSync(ENCODE_WASM_PATH);
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		await initEncode(wasmModule);
	}
	webpEncodeInitialized = true;
}

export function webp(options?: Partial<EncodeOptions>): Encoder {
	return async (image) => {
		await initializeEncoder();
		const { default: encode } = await import("@jsquash/webp/encode");
		const data = await encode(image, options);
		return {
			format: "image/webp",
			data,
		};
	};
}
