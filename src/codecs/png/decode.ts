/**
 * PNG decoder for decoding PNG images
 */

import type { Decoder } from "../../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../../utils/environment";

let pngDecodeInitialized = false;

const WASM_PATH = "node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm";

async function initializeDecoder() {
	if (pngDecodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		const { init: initDecode } = await import("@jsquash/png/decode");
		await initDecode(WASM_PATH);
	} else if (isRunningInNode) {
		const [{ init: initDecode }, fs] = await Promise.all([
			import("@jsquash/png/decode"),
			import("node:fs"),
		]);
		const wasmBuffer = fs.readFileSync(WASM_PATH);
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		await initDecode(wasmModule);
	}
	pngDecodeInitialized = true;
}

export function decode(): Decoder {
	return async (buffer) => {
		await initializeDecoder();
		const { default: decode } = await import("@jsquash/png/decode");
		const data = await decode(buffer, {});
		return {
			format: "image/png",
			data,
		};
	};
}
