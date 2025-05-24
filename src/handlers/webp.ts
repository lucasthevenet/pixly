import decode, { init as initDecode } from "@jsquash/webp/decode";
import encode, { init as initEncode } from "@jsquash/webp/encode";
import type { ImageHandler } from "../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../utils/environment";

const WEBP_ENC_WASM = "node_modules/@jsquash/webp/codec/enc/webp_enc.wasm";
const WEBP_DEC_WASM = "node_modules/@jsquash/webp/codec/dec/webp_dec.wasm";

let isDecodeInitialized = false;
let isEncodeInitialized = false;

async function initializeDecoder(): Promise<void> {
	if (isDecodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		await initDecode(WEBP_DEC_WASM);
		isDecodeInitialized = true;
		return;
	}

	if (isRunningInNode) {
		const fs = await import("node:fs");
		const webpDecWasmBuffer = fs.readFileSync(WEBP_DEC_WASM);
		const webpDecWasmModule = await WebAssembly.compile(webpDecWasmBuffer);
		await initDecode(webpDecWasmModule);
		isDecodeInitialized = true;
		return;
	}
}

async function initializeEncoder(): Promise<void> {
	if (isEncodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		await initEncode(WEBP_ENC_WASM);
		isEncodeInitialized = true;
		return;
	}

	if (isRunningInNode) {
		const fs = await import("node:fs");
		const webpEncWasmBuffer = fs.readFileSync(WEBP_ENC_WASM);
		const webpEncWasmModule = await WebAssembly.compile(webpEncWasmBuffer);
		await initEncode(webpEncWasmModule);
		isEncodeInitialized = true;
		return;
	}
}

export const WebpHandler: ImageHandler = {
	async decode(buffer) {
		await initializeDecoder();
		return decode(buffer);
	},
	async encode(image, options) {
		await initializeEncoder();
		return encode(image, options);
	},
};
