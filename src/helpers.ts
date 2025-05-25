/**
 * Helper functions with actual codec logic for tree-shaking optimization
 */

import type { MimeType, Decoder, Encoder } from "./types";
import { isRunningInCloudFlareWorkers, isRunningInNode } from "./utils/environment";

// === Magic byte detection for auto decoder ===

export const getFormatFromMagicBytes = (
	magic: Uint8Array,
): MimeType | undefined => {
	if (
		magic[0] === 0x89 &&
		magic[1] === 0x50 &&
		magic[2] === 0x4e &&
		magic[3] === 0x47
	) {
		return "image/png";
	}
	if (magic[0] === 0xff && magic[1] === 0xd8) {
		return "image/jpeg";
	}
	if (
		magic[0] === 0x52 &&
		magic[1] === 0x49 &&
		magic[2] === 0x46 &&
		magic[3] === 0x46 &&
		magic[8] === 0x57 &&
		magic[9] === 0x45 &&
		magic[10] === 0x42 &&
		magic[11] === 0x50
	) {
		return "image/webp";
	}
	if (
		magic[0] === 0x00 &&
		magic[1] === 0x00 &&
		magic[2] === 0x00 &&
		magic[3] === 0x0c &&
		magic[4] === 0x6a &&
		magic[5] === 0x58 &&
		magic[6] === 0x4c &&
		magic[7] === 0x20
	) {
		return "image/jxl";
	}
	if (
		magic[0] === 0x00 &&
		magic[1] === 0x00 &&
		magic[2] === 0x00 &&
		magic[3] === 0x1c &&
		magic[4] === 0x66 &&
		magic[5] === 0x74 &&
		magic[6] === 0x79 &&
		magic[7] === 0x70 &&
		magic[8] === 0x61 &&
		magic[9] === 0x76 &&
		magic[10] === 0x69 &&
		magic[11] === 0x66
	) {
		return "image/avif";
	}
	if (
		magic[0] === 0x71 &&
		magic[1] === 0x6f &&
		magic[2] === 0x69 &&
		magic[3] === 0x66
	) {
		return "image/qoi";
	}
	return undefined;
};

// === Auto decoder with format detection ===

export function auto(preserveMetadata = false): Decoder {
	return async (buffer: ArrayBuffer): Promise<ImageData> => {
		const uint8Buffer = new Uint8Array(buffer);
		const magic = uint8Buffer.slice(0, 16);
		const format = getFormatFromMagicBytes(magic) ?? "image/png";

		switch (format) {
			case "image/png":
				return png(preserveMetadata)(buffer);
			case "image/jpeg":
				return jpeg(preserveMetadata)(buffer);
			case "image/webp":
				return webpDecoder(preserveMetadata)(buffer);
			case "image/avif":
				return avif(preserveMetadata)(buffer);
			case "image/jxl":
				return jxl(preserveMetadata)(buffer);
			case "image/qoi":
				return qoi(preserveMetadata)(buffer);
			default:
				throw new Error(`Unsupported format: ${format}`);
		}
	};
}

// === PNG Decoder/Encoder ===

let pngDecodeInitialized = false;
let pngEncodeInitialized = false;

export function png(preserveMetadata = false): Decoder {
	return async (buffer: ArrayBuffer): Promise<ImageData> => {
		const { default: decode, init: initDecode } = await import("@jsquash/png/decode");
		
		if (!pngDecodeInitialized) {
			const WASM_PATH = "node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm";
			
			if (isRunningInCloudFlareWorkers) {
				await initDecode(WASM_PATH);
			} else if (isRunningInNode) {
				const fs = await import("node:fs");
				const wasmBuffer = fs.readFileSync(WASM_PATH);
				const wasmModule = await WebAssembly.compile(wasmBuffer);
				await initDecode(wasmModule);
			}
			pngDecodeInitialized = true;
		}

		return decode(buffer, {});
	};
}

export function pngEncoder(compressionLevel = 9): Encoder {
	return async (image: ImageData): Promise<ArrayBuffer> => {
		const { default: encode, init: initEncode } = await import("@jsquash/png/encode");
		
		if (!pngEncodeInitialized) {
			const WASM_PATH = "node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm";
			
			if (isRunningInCloudFlareWorkers) {
				await initEncode(WASM_PATH);
			} else if (isRunningInNode) {
				const fs = await import("node:fs");
				const wasmBuffer = fs.readFileSync(WASM_PATH);
				const wasmModule = await WebAssembly.compile(wasmBuffer);
				await initEncode(wasmModule);
			}
			pngEncodeInitialized = true;
		}

		// @ts-expect-error function overload not working
		return encode(image);
	};
}

// === JPEG Decoder/Encoder ===

let jpegDecodeInitialized = false;
let jpegEncodeInitialized = false;

export function jpeg(preserveMetadata = false): Decoder {
	return async (buffer: ArrayBuffer): Promise<ImageData> => {
		const { default: decode, init: initDecode } = await import("@jsquash/jpeg/decode");
		
		if (!jpegDecodeInitialized) {
			const WASM_PATH = "node_modules/@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm";
			
			if (isRunningInCloudFlareWorkers) {
				await initDecode(WASM_PATH);
			} else if (isRunningInNode) {
				const fs = await import("node:fs");
				const wasmBuffer = fs.readFileSync(WASM_PATH);
				const wasmModule = await WebAssembly.compile(wasmBuffer);
				await initDecode(wasmModule);
			}
			jpegDecodeInitialized = true;
		}

		return decode(buffer);
	};
}

export function jpegEncoder(quality = 80): Encoder {
	return async (image: ImageData): Promise<ArrayBuffer> => {
		const { default: encode, init: initEncode } = await import("@jsquash/jpeg/encode");
		
		if (!jpegEncodeInitialized) {
			const WASM_PATH = "node_modules/@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm";
			
			if (isRunningInCloudFlareWorkers) {
				await initEncode(WASM_PATH);
			} else if (isRunningInNode) {
				const fs = await import("node:fs");
				const wasmBuffer = fs.readFileSync(WASM_PATH);
				const wasmModule = await WebAssembly.compile(wasmBuffer);
				await initEncode(wasmModule);
			}
			jpegEncodeInitialized = true;
		}

		return encode(image);
	};
}

// === WebP Decoder/Encoder ===

let webpDecodeInitialized = false;
let webpEncodeInitialized = false;

export function webpDecoder(preserveMetadata = false): Decoder {
	return async (buffer: ArrayBuffer): Promise<ImageData> => {
		const { default: decode, init: initDecode } = await import("@jsquash/webp/decode");
		
		if (!webpDecodeInitialized) {
			const WASM_PATH = "node_modules/@jsquash/webp/codec/dec/webp_dec.wasm";
			
			if (isRunningInCloudFlareWorkers) {
				await initDecode(WASM_PATH);
			} else if (isRunningInNode) {
				const fs = await import("node:fs");
				const wasmBuffer = fs.readFileSync(WASM_PATH);
				const wasmModule = await WebAssembly.compile(wasmBuffer);
				await initDecode(wasmModule);
			}
			webpDecodeInitialized = true;
		}

		return decode(buffer);
	};
}

export function webp(quality = 80, compressionLevel = 9): Encoder {
	return async (image: ImageData): Promise<ArrayBuffer> => {
		const { default: encode, init: initEncode } = await import("@jsquash/webp/encode");
		
		if (!webpEncodeInitialized) {
			const WASM_PATH = "node_modules/@jsquash/webp/codec/enc/webp_enc.wasm";
			
			if (isRunningInCloudFlareWorkers) {
				await initEncode(WASM_PATH);
			} else if (isRunningInNode) {
				const fs = await import("node:fs");
				const wasmBuffer = fs.readFileSync(WASM_PATH);
				const wasmModule = await WebAssembly.compile(wasmBuffer);
				await initEncode(wasmModule);
			}
			webpEncodeInitialized = true;
		}

		return encode(image);
	};
}

// === AVIF Decoder/Encoder ===

let avifDecodeInitialized = false;
let avifEncodeInitialized = false;

export function avif(preserveMetadata = false): Decoder {
	return async (buffer: ArrayBuffer): Promise<ImageData> => {
		const { default: decode, init: initDecode } = await import("@jsquash/avif/decode");
		
		if (!avifDecodeInitialized) {
			const WASM_PATH = "node_modules/@jsquash/avif/codec/dec/avif_dec.wasm";
			
			if (isRunningInCloudFlareWorkers) {
				await initDecode(WASM_PATH);
			} else if (isRunningInNode) {
				const fs = await import("node:fs");
				const wasmBuffer = fs.readFileSync(WASM_PATH);
				const wasmModule = await WebAssembly.compile(wasmBuffer);
				await initDecode(wasmModule);
			}
			avifDecodeInitialized = true;
		}

		const result = await decode(buffer);
		
		if (!result) {
			throw new Error("Failed to decode AVIF image");
		}

		return result;
	};
}

export function avifEncoder(quality = 80): Encoder {
	return async (image: ImageData): Promise<ArrayBuffer> => {
		const { default: encode, init: initEncode } = await import("@jsquash/avif/encode");
		
		if (!avifEncodeInitialized) {
			const WASM_PATH = "node_modules/@jsquash/avif/codec/enc/avif_enc.wasm";
			
			if (isRunningInCloudFlareWorkers) {
				await initEncode(WASM_PATH);
			} else if (isRunningInNode) {
				const fs = await import("node:fs");
				const wasmBuffer = fs.readFileSync(WASM_PATH);
				const wasmModule = await WebAssembly.compile(wasmBuffer);
				await initEncode(wasmModule);
			}
			avifEncodeInitialized = true;
		}

		return encode(image);
	};
}

// === JXL Decoder/Encoder ===

let jxlDecodeInitialized = false;
let jxlEncodeInitialized = false;

export function jxl(preserveMetadata = false): Decoder {
	return async (buffer: ArrayBuffer): Promise<ImageData> => {
		const { default: decode, init: initDecode } = await import("@jsquash/jxl/decode");
		
		if (!jxlDecodeInitialized) {
			const WASM_PATH = "node_modules/@jsquash/jxl/codec/pkg/jxl_dec_bg.wasm";
			
			if (isRunningInCloudFlareWorkers) {
				await initDecode(WASM_PATH);
			} else if (isRunningInNode) {
				const fs = await import("node:fs");
				const wasmBuffer = fs.readFileSync(WASM_PATH);
				const wasmModule = await WebAssembly.compile(wasmBuffer);
				await initDecode(wasmModule);
			}
			jxlDecodeInitialized = true;
		}

		return decode(buffer);
	};
}

export function jxlEncoder(quality = 80): Encoder {
	return async (image: ImageData): Promise<ArrayBuffer> => {
		const { default: encode, init: initEncode } = await import("@jsquash/jxl/encode");
		
		if (!jxlEncodeInitialized) {
			const WASM_PATH = "node_modules/@jsquash/jxl/codec/pkg/jxl_enc_bg.wasm";
			
			if (isRunningInCloudFlareWorkers) {
				await initEncode(WASM_PATH);
			} else if (isRunningInNode) {
				const fs = await import("node:fs");
				const wasmBuffer = fs.readFileSync(WASM_PATH);
				const wasmModule = await WebAssembly.compile(wasmBuffer);
				await initEncode(wasmModule);
			}
			jxlEncodeInitialized = true;
		}

		return encode(image);
	};
}

// === QOI Decoder/Encoder ===

let qoiDecodeInitialized = false;
let qoiEncodeInitialized = false;

export function qoi(preserveMetadata = false): Decoder {
	return async (buffer: ArrayBuffer): Promise<ImageData> => {
		const { default: decode, init: initDecode } = await import("@jsquash/qoi/decode");
		
		if (!qoiDecodeInitialized) {
			const WASM_PATH = "node_modules/@jsquash/qoi/codec/pkg/qoi_bg.wasm";
			
			if (isRunningInCloudFlareWorkers) {
				await initDecode(WASM_PATH);
			} else if (isRunningInNode) {
				const fs = await import("node:fs");
				const wasmBuffer = fs.readFileSync(WASM_PATH);
				const wasmModule = await WebAssembly.compile(wasmBuffer);
				await initDecode(wasmModule);
			}
			qoiDecodeInitialized = true;
		}

		return decode(buffer);
	};
}

export function qoiEncoder(): Encoder {
	return async (image: ImageData): Promise<ArrayBuffer> => {
		const { default: encode, init: initEncode } = await import("@jsquash/qoi/encode");
		
		if (!qoiEncodeInitialized) {
			const WASM_PATH = "node_modules/@jsquash/qoi/codec/pkg/qoi_bg.wasm";
			
			if (isRunningInCloudFlareWorkers) {
				await initEncode(WASM_PATH);
			} else if (isRunningInNode) {
				const fs = await import("node:fs");
				const wasmBuffer = fs.readFileSync(WASM_PATH);
				const wasmModule = await WebAssembly.compile(wasmBuffer);
				await initEncode(wasmModule);
			}
			qoiEncodeInitialized = true;
		}

		return encode(image);
	};
}