import decode, { init as initDecode } from "@jsquash/png/decode";
import encode, { init as initEncode } from "@jsquash/png/encode";
import type { ImageHandler } from "../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../utils/environment";

const PNG_WASM = "node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm";

let isDecodeInitialized = false;
let isEncodeInitialized = false;

async function initializeDecoder(): Promise<void> {
	if (isDecodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		await initDecode(PNG_WASM);
		isDecodeInitialized = true;
		return;
	}

	if (isRunningInNode) {
		const fs = await import("node:fs");
		const pngWasmBuffer = fs.readFileSync(PNG_WASM);
		const pngWasmModule = await WebAssembly.compile(pngWasmBuffer);
		await initDecode(pngWasmModule);
		isDecodeInitialized = true;
		return;
	}
}

async function initializeEncoder(): Promise<void> {
	if (isEncodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		await initEncode(PNG_WASM);
		isEncodeInitialized = true;
		return;
	}

	if (isRunningInNode) {
		const fs = await import("node:fs");
		const pngWasmBuffer = fs.readFileSync(PNG_WASM);
		const pngWasmModule = await WebAssembly.compile(pngWasmBuffer);
		await initEncode(pngWasmModule);
		isEncodeInitialized = true;
		return;
	}
}

export const PngHandler: ImageHandler = {
	async decode(buffer) {
		await initializeDecoder();

		return decode(buffer, {});
	},
	async encode(image) {
		await initializeEncoder();

		// @ts-expect-error function overload not working
		return encode(image);
	},
};
