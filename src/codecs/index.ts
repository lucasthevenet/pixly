/**
 * Re-exports from individual codec files for tree-shaking optimization
 */

// Auto decoder with format detection
export { auto, getFormatFromMagicBytes } from "./auto";

// PNG codec
export { png, pngEncoder } from "./png";

// JPEG codec
export { jpeg, jpegEncoder } from "./jpeg";

// WebP codec
export { webpDecoder, webp } from "./webp";

// AVIF codec
export { avif, avifEncoder } from "./avif";

// JXL codec
export { jxl, jxlEncoder } from "./jxl";

// QOI codec
export { qoi, qoiEncoder } from "./qoi";
