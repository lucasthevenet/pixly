/**
 * JPEG codec for decoding and encoding JPEG images
 */

import type { DecodeOptions, EncodeOptions } from "@jsquash/jpeg/meta";
import type { Decoder, Encoder } from "../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../utils/environment";

let jpegDecodeInitialized = false;
let jpegEncodeInitialized = false;

const DECODE_WASM_PATH =
	"node_modules/@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm";
const ENCODE_WASM_PATH =
	"node_modules/@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm";

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

export function jpeg(options?: Partial<DecodeOptions>): Decoder {
	return async (buffer: ArrayBuffer): Promise<ImageData> => {
		await initializeDecoder();
		const { default: decode } = await import("@jsquash/jpeg/decode");
		return decode(buffer, options);
	};
}

export function jpegEncoder(options?: Partial<EncodeOptions>): Encoder {
	return async (image: ImageData): Promise<ArrayBuffer> => {
		await initializeEncoder();
		const { default: encode } = await import("@jsquash/jpeg/encode");
		return encode(image, options);
	};
}
