/**
 * JXL codec for decoding and encoding JXL images
 */

import type { EncodeOptions } from "@jsquash/jxl/meta";
import type { Decoder, Encoder } from "../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../utils/environment";

let jxlDecodeInitialized = false;
let jxlEncodeInitialized = false;

const DECODE_WASM_PATH = "node_modules/@jsquash/jxl/codec/pkg/jxl_dec_bg.wasm";
const ENCODE_WASM_PATH = "node_modules/@jsquash/jxl/codec/pkg/jxl_enc_bg.wasm";

async function initializeDecoder() {
	if (jxlDecodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		const { init: initDecode } = await import("@jsquash/jxl/decode");
		await initDecode(DECODE_WASM_PATH);
	} else if (isRunningInNode) {
		const [{ init: initDecode }, fs] = await Promise.all([
			import("@jsquash/jxl/decode"),
			import("node:fs"),
		]);
		const wasmBuffer = fs.readFileSync(DECODE_WASM_PATH);
		const wasmModule = await WebAssembly.compile(wasmBuffer);
		await initDecode(wasmModule);
	}
	jxlDecodeInitialized = true;
}

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

export function jxl(): Decoder {
	return async (buffer: ArrayBuffer): Promise<ImageData> => {
		await initializeDecoder();
		const { default: decode } = await import("@jsquash/jxl/decode");
		return decode(buffer);
	};
}

export function jxlEncoder(options?: Partial<EncodeOptions>): Encoder {
	return async (image: ImageData): Promise<ArrayBuffer> => {
		await initializeEncoder();
		const { default: encode } = await import("@jsquash/jxl/encode");
		return encode(image, options);
	};
}
