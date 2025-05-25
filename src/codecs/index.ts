/**
 * Re-exports from individual codec files for tree-shaking optimization
 */

// Auto decoder with format detection
export { auto, getFormatFromMagicBytes } from "./codecs/auto";

// PNG codec
export { png, pngEncoder } from "./codecs/png";

// JPEG codec
export { jpeg, jpegEncoder } from "./codecs/jpeg";

// WebP codec
export { webpDecoder, webp } from "./codecs/webp";

// AVIF codec
export { avif, avifEncoder } from "./codecs/avif";

// JXL codec
export { jxl, jxlEncoder } from "./codecs/jxl";

// QOI codec
export { qoi, qoiEncoder } from "./codecs/qoi";