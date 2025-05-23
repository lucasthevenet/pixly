import decode, { init as initDecode } from "@jsquash/jpeg/decode";
import encode, { init as initEncode } from "@jsquash/jpeg/encode";
import type { ImageHandler } from "../types";
import {
  isRunningInCloudFlareWorkers,
  isRunningInNode,
} from "../utils/environment";

const JPEG_ENC_WASM = "node_modules/@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm";
const JPEG_DEC_WASM = "node_modules/@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm";

export const JpegHandler: ImageHandler = {
  async decode(buffer) {
    if (isRunningInCloudFlareWorkers) {
      await initDecode(JPEG_DEC_WASM);
    }
    if (isRunningInNode) {
      const fs = await import("node:fs");
      const jpegDecWasmBuffer = fs.readFileSync(JPEG_DEC_WASM);
      const jpegDecWasmModule = await WebAssembly.compile(jpegDecWasmBuffer);
      await initDecode(jpegDecWasmModule);
    }

    return decode(buffer);
  },
  async encode(image, options) {
    if (isRunningInCloudFlareWorkers) {
      await initEncode(JPEG_ENC_WASM);
    }

    if (isRunningInNode) {
      const fs = await import("node:fs");
      const jpegEncWasmBuffer = fs.readFileSync(JPEG_ENC_WASM);
      const jpegEncWasmModule = await WebAssembly.compile(jpegEncWasmBuffer);
      await initEncode(jpegEncWasmModule);
    }

    return encode(image, options);
  },
};
