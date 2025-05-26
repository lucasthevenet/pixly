/**
 * WebP decoder for decoding WebP images
 */

import type { Decoder } from "../../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../../utils/environment";

let webpDecodeInitialized = false;

const DECODE_WASM_PATH = "node_modules/@jsquash/webp/codec/dec/webp_dec.wasm";

async function initializeDecoder() {
	if (webpDecodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		const { init: initDecode } = await import("@jsquash/webp/decode");
		await initDecode(DECODE_WASM_PATH);
	} else if (isRunningInNode) {
		const [{ init: initDecode }, fs] = await Promise.all([
			import("@jsquash/webp/decode"),
			import("node:fs"),
		]);
		const wasmBuffer = fs.readFileSync(DECODE_WASM_PATH);
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		await initDecode(wasmModule);
	}
	webpDecodeInitialized = true;
}

export function decode(): Decoder {
	return async (buffer) => {
		await initializeDecoder();
		const { default: decode } = await import("@jsquash/webp/decode");
		const data = await decode(buffer);

		return {
			format: "image/webp",
			data,
		};
	};
}
