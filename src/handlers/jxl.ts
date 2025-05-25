import decode, { init as initDecode } from "@jsquash/jxl/decode";
import encode, { init as initEncode } from "@jsquash/jxl/encode";
import type { ImageHandler } from "../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../utils/environment";

const JXL_ENC_WASM = "node_modules/@jsquash/jxl/codec/enc/jxl_enc.wasm";
const JXL_DEC_WASM = "node_modules/@jsquash/jxl/codec/dec/jxl_dec.wasm";

let isDecodeInitialized = false;
let isEncodeInitialized = false;

async function initializeDecoder(): Promise<void> {
	if (isDecodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		await initDecode(JXL_DEC_WASM);
		isDecodeInitialized = true;
		return;
	}

	if (isRunningInNode) {
		const fs = await import("node:fs");
		const jxlDecWasmBuffer = fs.readFileSync(JXL_DEC_WASM);
		const jxlDecWasmModule = await WebAssembly.compile(jxlDecWasmBuffer);
		await initDecode(jxlDecWasmModule);
		isDecodeInitialized = true;
		return;
	}
}

async function initializeEncoder(): Promise<void> {
	if (isEncodeInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		await initEncode(JXL_ENC_WASM);
		isEncodeInitialized = true;
		return;
	}

	if (isRunningInNode) {
		const fs = await import("node:fs");
		const jxlEncWasmBuffer = fs.readFileSync(JXL_ENC_WASM);
		const jxlEncWasmModule = await WebAssembly.compile(jxlEncWasmBuffer);
		await initEncode(jxlEncWasmModule);
		isEncodeInitialized = true;
		return;
	}
}

export const JxlHandler: ImageHandler = {
	async decode(buffer) {
		await initializeDecoder();
		return decode(buffer);
	},
	async encode(image) {
		await initializeEncoder();
		return encode(image);
	},
};
