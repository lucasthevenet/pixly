/**
 * PNG codec for decoding and encoding PNG images
 */

import type { Decoder, Encoder } from "../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../utils/environment";

let pngDecodeInitialized = false;
let pngEncodeInitialized = false;

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

async function initializeEncoder() {
	if (pngEncodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		const { init: initEncode } = await import("@jsquash/png/encode");
		await initEncode(WASM_PATH);
	} else if (isRunningInNode) {
		const [{ init: initEncode }, fs] = await Promise.all([
			import("@jsquash/png/encode"),
			import("node:fs"),
		]);
		const wasmBuffer = fs.readFileSync(WASM_PATH);
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		await initEncode(wasmModule);
	}
	pngEncodeInitialized = true;
}

export function png(): Decoder {
	return async (buffer: ArrayBuffer): Promise<ImageData> => {
		await initializeDecoder();
		const { default: decode } = await import("@jsquash/png/decode");
		return decode(buffer, {});
	};
}

export function pngEncoder(): Encoder {
	return async (image: ImageData): Promise<ArrayBuffer> => {
		await initializeEncoder();
		const { default: encode } = await import("@jsquash/png/encode");
		// @ts-expect-error function overload not working
		return encode(image);
	};
}
