/**
 * Re-exports from individual decoder files for tree-shaking optimization
 */

// Auto decoder with format detection
export { auto } from "./auto";

// PNG decoder
export { png } from "./png";

// JPEG decoder
export { jpeg } from "./jpeg";

// WebP decoder
export { webpDecoder } from "./webp";

// AVIF decoder
export { avif } from "./avif";

// JXL decoder
export { jxl } from "./jxl";

// QOI decoder
export { qoi } from "./qoi";