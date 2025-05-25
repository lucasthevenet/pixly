/**
 * AVIF codec for decoding and encoding AVIF images
 */

import type { EncodeOptions } from "@jsquash/avif/meta";
import type { Decoder, Encoder } from "../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../utils/environment";

let avifDecodeInitialized = false;
let avifEncodeInitialized = false;

const DECODE_WASM_PATH = "node_modules/@jsquash/avif/codec/dec/avif_dec.wasm";
const ENCODE_WASM_PATH = "node_modules/@jsquash/avif/codec/enc/avif_enc.wasm";

async function initializeDecoder() {
	if (avifDecodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		const { init: initDecode } = await import("@jsquash/avif/decode");
		await initDecode(DECODE_WASM_PATH);
	} else if (isRunningInNode) {
		const [{ init: initDecode }, fs] = await Promise.all([
			import("@jsquash/avif/decode"),
			import("node:fs"),
		]);
		const wasmBuffer = fs.readFileSync(DECODE_WASM_PATH);
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		await initDecode(wasmModule);
	}
	avifDecodeInitialized = true;
}

async function initializeEncoder() {
	if (avifEncodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		const { init: initEncode } = await import("@jsquash/avif/encode");
		await initEncode(ENCODE_WASM_PATH);
	} else if (isRunningInNode) {
		const [{ init: initEncode }, fs] = await Promise.all([
			import("@jsquash/avif/encode"),
			import("node:fs"),
		]);
		const wasmBuffer = fs.readFileSync(ENCODE_WASM_PATH);
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		await initEncode(wasmModule);
	}
	avifEncodeInitialized = true;
}

export function avif(): Decoder {
	return async (buffer: ArrayBuffer): Promise<ImageData> => {
		await initializeDecoder();
		const { default: decode } = await import("@jsquash/avif/decode");

		const result = await decode(buffer);
		if (!result) {
			throw new Error("Failed to decode AVIF image");
		}

		return result;
	};
}

export function avifEncoder(options?: Partial<EncodeOptions>): Encoder {
	return async (image: ImageData): Promise<ArrayBuffer> => {
		await initializeEncoder();
		const { default: encode } = await import("@jsquash/avif/encode");
		return encode(image, options);
	};
}
