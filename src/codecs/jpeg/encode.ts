/**
 * JPEG encoder for encoding JPEG images
 */

import type { EncodeOptions } from "@jsquash/jpeg/meta";
import type { Encoder } from "../../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../../utils/environment";

let jpegEncodeInitialized = false;

const ENCODE_WASM_PATH =
	"node_modules/@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm";

async function initializeEncoder() {
	if (jpegEncodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		const { init: initEncode } = await import("@jsquash/jpeg/encode");
		await initEncode(ENCODE_WASM_PATH);
	} else if (isRunningInNode) {
		const [{ init: initEncode }, fs] = await Promise.all([
			import("@jsquash/jpeg/encode"),
			import("node:fs"),
		]);
		const wasmBuffer = fs.readFileSync(ENCODE_WASM_PATH);
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		await initEncode(wasmModule);
	}
	jpegEncodeInitialized = true;
}

export function encode(options?: Partial<EncodeOptions>): Encoder {
	return async (image: ImageData) => {
		await initializeEncoder();
		const { default: encode } = await import("@jsquash/jpeg/encode");
		const data = await encode(image, options);
		return {
			format: "image/jpeg",
			data,
		};
	};
}
