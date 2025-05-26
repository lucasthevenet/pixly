/**
 * JXL encoder for encoding JXL images
 */

import type { EncodeOptions } from "@jsquash/jxl/meta";
import type { Encoder } from "../../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../../utils/environment";

let jxlEncodeInitialized = false;

const ENCODE_WASM_PATH = "node_modules/@jsquash/jxl/codec/pkg/jxl_enc_bg.wasm";

async function initializeEncoder() {
	if (jxlEncodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		const { init: initEncode } = await import("@jsquash/jxl/encode");
		await initEncode(ENCODE_WASM_PATH);
	} else if (isRunningInNode) {
		const [{ init: initEncode }, fs] = await Promise.all([
			import("@jsquash/jxl/encode"),
			import("node:fs"),
		]);
		const wasmBuffer = fs.readFileSync(ENCODE_WASM_PATH);
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		await initEncode(wasmModule);
	}
	jxlEncodeInitialized = true;
}

export function encode(options?: Partial<EncodeOptions>): Encoder {
	return async (image: ImageData) => {
		await initializeEncoder();
		const { default: encode } = await import("@jsquash/jxl/encode");
		const data = await encode(image, options);
		return {
			format: "image/jxl",
			data,
		};
	};
}
