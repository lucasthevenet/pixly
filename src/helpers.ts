/**
 * Helper functions for decoders and encoders in the composable API
 */

import type { MimeType } from "./types";
import type { 
	DecoderConfig, 
	EncoderConfig,
	WebpEncoderOptions,
	JpegEncoderOptions,
	PngEncoderOptions,
	AvifEncoderOptions,
	JxlEncoderOptions,
	QoiEncoderOptions
} from "./composable-types";

// === Decoder Helpers ===

/**
 * Auto-detect the image format from the input
 */
export function auto(): DecoderConfig {
	return { type: "auto" };
}

/**
 * Force decode as JPEG
 */
export function jpeg(): DecoderConfig {
	return { type: "image/jpeg" };
}

/**
 * Force decode as PNG
 */
export function png(): DecoderConfig {
	return { type: "image/png" };
}

/**
 * Force decode as WebP
 */
export function webpDecoder(): DecoderConfig {
	return { type: "image/webp" };
}

/**
 * Force decode as AVIF
 */
export function avif(): DecoderConfig {
	return { type: "image/avif" };
}

/**
 * Force decode as JXL
 */
export function jxl(): DecoderConfig {
	return { type: "image/jxl" };
}

/**
 * Force decode as QOI
 */
export function qoi(): DecoderConfig {
	return { type: "image/qoi" };
}

// === Encoder Helpers ===

/**
 * Encode as WebP with optional quality and compression settings
 */
export function webp(options: WebpEncoderOptions = {}): EncoderConfig {
	return {
		format: "image/webp",
		quality: options.quality ?? 80,
		compressionLevel: options.compressionLevel ?? 9,
	};
}

/**
 * Encode as JPEG with optional quality setting
 */
export function jpegEncoder(options: JpegEncoderOptions = {}): EncoderConfig {
	return {
		format: "image/jpeg",
		quality: options.quality ?? 80,
	};
}

/**
 * Encode as PNG with optional compression level
 */
export function pngEncoder(options: PngEncoderOptions = {}): EncoderConfig {
	return {
		format: "image/png",
		compressionLevel: options.compressionLevel ?? 9,
	};
}

/**
 * Encode as AVIF with optional quality setting
 */
export function avifEncoder(options: AvifEncoderOptions = {}): EncoderConfig {
	return {
		format: "image/avif",
		quality: options.quality ?? 80,
	};
}

/**
 * Encode as JXL with optional quality setting
 */
export function jxlEncoder(options: JxlEncoderOptions = {}): EncoderConfig {
	return {
		format: "image/jxl",
		quality: options.quality ?? 80,
	};
}

/**
 * Encode as QOI (no configurable options)
 */
export function qoiEncoder(options: QoiEncoderOptions = {}): EncoderConfig {
	return {
		format: "image/qoi",
	};
}

/**
 * Create a custom decoder configuration
 */
export function customDecoder(
	type: MimeType,
	preserveMetadata?: boolean
): DecoderConfig {
	return {
		type,
		preserveMetadata,
	};
}

/**
 * Create a custom encoder configuration
 */
export function customEncoder(config: EncoderConfig): EncoderConfig {
	return { ...config };
}