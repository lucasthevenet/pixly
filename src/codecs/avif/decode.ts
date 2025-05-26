/**
 * AVIF decoder for decoding AVIF images
 */

import type { Decoder } from "../../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../../utils/environment";

let avifDecodeInitialized = false;

const DECODE_WASM_PATH = "node_modules/@jsquash/avif/codec/dec/avif_dec.wasm";

async function initializeDecoder() {
	if (avifDecodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		const { init: initDecode } = await import("@jsquash/avif/decode");
		await initDecode(DECODE_WASM_PATH);
	} else if (isRunningInNode) {
		const [{ init: initDecode }, fs] = await Promise.all([
			import("@jsquash/avif/decode"),
			import("node:fs"),
		]);
		const wasmBuffer = fs.readFileSync(DECODE_WASM_PATH);
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		await initDecode(wasmModule);
	}
	avifDecodeInitialized = true;
}

export function decode(): Decoder {
	return async (buffer) => {
		await initializeDecoder();
		const { default: decode } = await import("@jsquash/avif/decode");

		const result = await decode(buffer);
		if (!result) {
			throw new Error("Failed to decode AVIF image");
		}

		return {
			data: result,
			format: "image/avif",
		};
	};
}
