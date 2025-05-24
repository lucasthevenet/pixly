import decode, { init as initDecode } from "@jsquash/webp/decode";
import encode, { init as initEncode } from "@jsquash/webp/encode";
import type { ImageHandler } from "../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../utils/environment";

const WEBP_ENC_WASM = "node_modules/@jsquash/webp/codec/enc/webp_enc.wasm";
const WEBP_DEC_WASM = "node_modules/@jsquash/webp/codec/dec/webp_dec.wasm";

export const WebpHandler: ImageHandler = {
	async decode(buffer) {
		if (isRunningInCloudFlareWorkers) {
			await initDecode(WEBP_DEC_WASM);
		}
		if (isRunningInNode) {
			const fs = await import("node:fs");
			const webpDecWasmBuffer = fs.readFileSync(WEBP_DEC_WASM);
			const webpDecWasmModule = await WebAssembly.compile(webpDecWasmBuffer);
			await initDecode(webpDecWasmModule);
		}

		return decode(buffer);
	},
	async encode(image, options) {
		if (isRunningInCloudFlareWorkers) {
			await initEncode(WEBP_ENC_WASM);
		}

		if (isRunningInNode) {
			const fs = await import("node:fs");
			const webpEncWasmBuffer = fs.readFileSync(WEBP_ENC_WASM);
			const webpEncWasmModule = await WebAssembly.compile(webpEncWasmBuffer);
			await initEncode(webpEncWasmModule);
		}

		return encode(image, options);
	},
};
