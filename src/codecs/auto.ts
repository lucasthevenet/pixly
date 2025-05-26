/**
 * Auto decoder that detects format and uses appropriate codec
 */

import type { Decoder, MimeType } from "../types";

export function auto(): Decoder {
	return async (buffer) => {
		const uint8Buffer = new Uint8Array(buffer);
		const magic = uint8Buffer.slice(0, 16);
		const format = getFormatFromMagicBytes(magic);

		switch (format) {
			case "image/avif": {
				const { decode } = await import("./avif/decode");
				return decode()(buffer);
			}
			case "image/jpeg": {
				const { decode } = await import("./jpeg/decode");
				return decode()(buffer);
			}
			case "image/jxl": {
				const { decode } = await import("./jxl/decode");
				return decode()(buffer);
			}
			case "image/png": {
				const { decode } = await import("./png/decode");
				return decode()(buffer);
			}
			case "image/qoi": {
				const { decode } = await import("./qoi/decode");
				return decode()(buffer);
			}
			case "image/webp": {
				const { decode } = await import("./webp/decode");
				return decode()(buffer);
			}
			default:
				throw new Error(`Unsupported format: ${format}`);
		}
	};
}

const getFormatFromMagicBytes = (magic: Uint8Array): MimeType | null => {
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

	return null;
};
