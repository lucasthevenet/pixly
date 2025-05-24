import decode, { init as initDecode } from "@jsquash/avif/decode";
import encode, { init as initEncode } from "@jsquash/avif/encode";
import type { ImageHandler } from "../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../utils/environment";

const AVIF_ENC_WASM = "node_modules/@jsquash/avif/codec/enc/avif_enc.wasm";
const AVIF_DEC_WASM = "node_modules/@jsquash/avif/codec/dec/avif_dec.wasm";

let isDecodeInitialized = false;
let isEncodeInitialized = false;

async function initializeDecoder(): Promise<void> {
	if (isDecodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		await initDecode(AVIF_DEC_WASM);
		isDecodeInitialized = true;
		return;
	}

	if (isRunningInNode) {
		const fs = await import("node:fs");
		const avifDecWasmBuffer = fs.readFileSync(AVIF_DEC_WASM);
		const avifDecWasmModule = await WebAssembly.compile(avifDecWasmBuffer);
		await initDecode(avifDecWasmModule);
		isDecodeInitialized = true;
		return;
	}
}

async function initializeEncoder(): Promise<void> {
	if (isEncodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		await initEncode(AVIF_ENC_WASM);
		isEncodeInitialized = true;
		return;
	}

	if (isRunningInNode) {
		const fs = await import("node:fs");
		const avifEncWasmBuffer = fs.readFileSync(AVIF_ENC_WASM);
		const avifEncWasmModule = await WebAssembly.compile(avifEncWasmBuffer);
		await initEncode(avifEncWasmModule);
		isEncodeInitialized = true;
		return;
	}
}

export const AvifHandler: ImageHandler = {
	async decode(buffer) {
		await initializeDecoder();

		const result = await decode(buffer);

		if (!result) {
			throw new Error("Failed to decode");
		}

		return result;
	},
	async encode(image) {
		await initializeEncoder();
		return encode(image);
	},
};
