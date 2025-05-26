/**
 * JXL decoder for decoding JXL images
 */

import type { Decoder } from "../../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../../utils/environment";

let jxlDecodeInitialized = false;

const DECODE_WASM_PATH = "node_modules/@jsquash/jxl/codec/pkg/jxl_dec_bg.wasm";

async function initializeDecoder() {
	if (jxlDecodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		const { init: initDecode } = await import("@jsquash/jxl/decode");
		await initDecode(DECODE_WASM_PATH);
	} else if (isRunningInNode) {
		const [{ init: initDecode }, fs] = await Promise.all([
			import("@jsquash/jxl/decode"),
			import("node:fs"),
		]);
		const wasmBuffer = fs.readFileSync(DECODE_WASM_PATH);
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		await initDecode(wasmModule);
	}
	jxlDecodeInitialized = true;
}

export function decode(): Decoder {
	return async (buffer: ArrayBuffer) => {
		await initializeDecoder();
		const { default: decode } = await import("@jsquash/jxl/decode");
		const data = await decode(buffer);
		return {
			format: "image/jxl",
			data,
		};
	};
}
