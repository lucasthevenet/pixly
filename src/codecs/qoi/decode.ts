/**
 * QOI decoder for decoding QOI images
 */

import type { Decoder } from "../../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../../utils/environment";

let qoiDecodeInitialized = false;

const WASM_PATH = "node_modules/@jsquash/qoi/codec/pkg/qoi_bg.wasm";

async function initializeDecoder() {
	if (qoiDecodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		const { init: initDecode } = await import("@jsquash/qoi/decode");
		await initDecode(WASM_PATH);
	} else if (isRunningInNode) {
		const [{ init: initDecode }, fs] = await Promise.all([
			import("@jsquash/qoi/decode"),
			import("node:fs"),
		]);
		const wasmBuffer = fs.readFileSync(WASM_PATH);
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		await initDecode(wasmModule);
	}
	qoiDecodeInitialized = true;
}

export function decode(): Decoder {
	return async (buffer) => {
		await initializeDecoder();
		const { default: decode } = await import("@jsquash/qoi/decode");
		const data = await decode(buffer);
		return {
			format: "image/qoi",
			data,
		};
	};
}
