/**
 * QOI codec for decoding and encoding QOI images
 */

import type { Decoder, Encoder } from "../types";
import { isRunningInCloudFlareWorkers, isRunningInNode } from "../utils/environment";

let qoiDecodeInitialized = false;
let qoiEncodeInitialized = false;

const WASM_PATH = "node_modules/@jsquash/qoi/codec/pkg/qoi_bg.wasm";

async function initializeDecoder() {
	if (qoiDecodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		const { init: initDecode } = await import("@jsquash/qoi/decode");
		await initDecode(WASM_PATH);
	} else if (isRunningInNode) {
		const [{ init: initDecode }, fs] = await Promise.all([
			import("@jsquash/qoi/decode"),
			import("node:fs")
		]);
		const wasmBuffer = fs.readFileSync(WASM_PATH);
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		await initDecode(wasmModule);
	}
	qoiDecodeInitialized = true;
}

async function initializeEncoder() {
	if (qoiEncodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		const { init: initEncode } = await import("@jsquash/qoi/encode");
		await initEncode(WASM_PATH);
	} else if (isRunningInNode) {
		const [{ init: initEncode }, fs] = await Promise.all([
			import("@jsquash/qoi/encode"),
			import("node:fs")
		]);
		const wasmBuffer = fs.readFileSync(WASM_PATH);
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		await initEncode(wasmModule);
	}
	qoiEncodeInitialized = true;
}

export function qoi(): Decoder {
	return async (buffer: ArrayBuffer): Promise<ImageData> => {
		await initializeDecoder();
		const { default: decode } = await import("@jsquash/qoi/decode");
		return decode(buffer);
	};
}

export function qoiEncoder(): Encoder {
	return async (image: ImageData): Promise<ArrayBuffer> => {
		await initializeEncoder();
		const { default: encode } = await import("@jsquash/qoi/encode");
		return encode(image);
	};
}