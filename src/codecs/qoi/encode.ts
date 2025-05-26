/**
 * QOI encoder for encoding QOI images
 */

import type { Encoder } from "../../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../../utils/environment";

let qoiEncodeInitialized = false;

const WASM_PATH = "node_modules/@jsquash/qoi/codec/pkg/qoi_bg.wasm";

async function initializeEncoder() {
	if (qoiEncodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		const { init: initEncode } = await import("@jsquash/qoi/encode");
		await initEncode(WASM_PATH);
	} else if (isRunningInNode) {
		const [{ init: initEncode }, fs] = await Promise.all([
			import("@jsquash/qoi/encode"),
			import("node:fs"),
		]);
		const wasmBuffer = fs.readFileSync(WASM_PATH);
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		await initEncode(wasmModule);
	}
	qoiEncodeInitialized = true;
}

export function encode(): Encoder {
	return async (image) => {
		await initializeEncoder();
		const { default: encode } = await import("@jsquash/qoi/encode");
		const data = await encode(image);
		return {
			format: "image/qoi",
			data,
		};
	};
}
