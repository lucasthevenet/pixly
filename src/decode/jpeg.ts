/**
 * JPEG decoder for decoding JPEG images
 */

import type { DecodeOptions } from "@jsquash/jpeg/meta";
import type { Decoder } from "../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../utils/environment";

let jpegDecodeInitialized = false;

const DECODE_WASM_PATH =
	"node_modules/@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm";

async function initializeDecoder() {
	if (jpegDecodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		const { init: initDecode } = await import("@jsquash/jpeg/decode");
		await initDecode(DECODE_WASM_PATH);
	} else if (isRunningInNode) {
		const [{ init: initDecode }, fs] = await Promise.all([
			import("@jsquash/jpeg/decode"),
			import("node:fs"),
		]);
		const wasmBuffer = fs.readFileSync(DECODE_WASM_PATH);
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		await initDecode(wasmModule);
	}
	jpegDecodeInitialized = true;
}

export function jpeg(options?: Partial<DecodeOptions>): Decoder {
	return async (buffer: ArrayBuffer) => {
		await initializeDecoder();
		const { default: decode } = await import("@jsquash/jpeg/decode");
		const data = await decode(buffer, options);
		return {
			format: "image/jpeg",
			data,
		};
	};
}
