/**
 * WebP codec for decoding and encoding WebP images
 */

import type { EncodeOptions } from "@jsquash/webp/meta";
import type { Decoder, Encoder } from "../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../utils/environment";

let webpDecodeInitialized = false;
let webpEncodeInitialized = false;

const DECODE_WASM_PATH = "node_modules/@jsquash/webp/codec/dec/webp_dec.wasm";
const ENCODE_WASM_PATH = "node_modules/@jsquash/webp/codec/enc/webp_enc.wasm";

async function initializeDecoder() {
	if (webpDecodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		const { init: initDecode } = await import("@jsquash/webp/decode");
		await initDecode(DECODE_WASM_PATH);
	} else if (isRunningInNode) {
		const [{ init: initDecode }, fs] = await Promise.all([
			import("@jsquash/webp/decode"),
			import("node:fs"),
		]);
		const wasmBuffer = fs.readFileSync(DECODE_WASM_PATH);
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		await initDecode(wasmModule);
	}
	webpDecodeInitialized = true;
}

async function initializeEncoder() {
	if (webpEncodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		const { init: initEncode } = await import("@jsquash/webp/encode");
		await initEncode(ENCODE_WASM_PATH);
	} else if (isRunningInNode) {
		const [{ init: initEncode }, fs] = await Promise.all([
			import("@jsquash/webp/encode"),
			import("node:fs"),
		]);
		const wasmBuffer = fs.readFileSync(ENCODE_WASM_PATH);
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		await initEncode(wasmModule);
	}
	webpEncodeInitialized = true;
}

export function webpDecoder(): Decoder {
	return async (buffer: ArrayBuffer): Promise<ImageData> => {
		await initializeDecoder();
		const { default: decode } = await import("@jsquash/webp/decode");
		return decode(buffer);
	};
}

export function webp(options?: Partial<EncodeOptions>): Encoder {
	return async (image: ImageData): Promise<ArrayBuffer> => {
		await initializeEncoder();
		const { default: encode } = await import("@jsquash/webp/encode");
		return encode(image, options);
	};
}
