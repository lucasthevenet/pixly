/**
 * AVIF encoder for encoding AVIF images
 */

import type { EncodeOptions } from "@jsquash/avif/meta";
import type { Encoder } from "../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../utils/environment";

let avifEncodeInitialized = false;

const ENCODE_WASM_PATH = "node_modules/@jsquash/avif/codec/enc/avif_enc.wasm";

async function initializeEncoder() {
	if (avifEncodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		const { init: initEncode } = await import("@jsquash/avif/encode");
		await initEncode(ENCODE_WASM_PATH);
	} else if (isRunningInNode) {
		const [{ init: initEncode }, fs] = await Promise.all([
			import("@jsquash/avif/encode"),
			import("node:fs"),
		]);
		const wasmBuffer = fs.readFileSync(ENCODE_WASM_PATH);
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		await initEncode(wasmModule);
	}
	avifEncodeInitialized = true;
}

export function avifEncoder(options?: Partial<EncodeOptions>): Encoder {
	return async (image) => {
		await initializeEncoder();
		const { default: encode } = await import("@jsquash/avif/encode");
		const result = await encode(image, options);

		return {
			data: result,
			format: "image/avif",
		};
	};
}
