import decode, { init as initDecode } from "@jsquash/avif/decode";
import encode, { init as initEncode } from "@jsquash/avif/encode";
import type { ImageHandler } from "../types";
import {
  isRunningInCloudFlareWorkers,
  isRunningInNode,
} from "../utils/environment";

const AVIF_ENC_WASM =
  "node_modules/@jsquash/avif/codec/enc/squoosh_avif_enc.wasm";
const AVIF_DEC_WASM =
  "node_modules/@jsquash/avif/codec/dec/squoosh_avif_dec.wasm";

export const AvifHandler: ImageHandler = {
  async decode(buffer) {
    if (isRunningInCloudFlareWorkers) {
      await initDecode(AVIF_DEC_WASM);
    }
    if (isRunningInNode) {
      const fs = await import("node:fs");
      const avifDecWasmBuffer = fs.readFileSync(AVIF_DEC_WASM);
      const avifDecWasmModule = await WebAssembly.compile(avifDecWasmBuffer);
      await initDecode(avifDecWasmModule);
    }

    const result = await decode(buffer);

    if (!result) {
      throw new Error("Failed to decode");
    }

    return result;
  },
  async encode(image) {
    if (isRunningInCloudFlareWorkers) {
      await initEncode(AVIF_ENC_WASM);
    }

    if (isRunningInNode) {
      const fs = await import("node:fs");
      const avifEncWasmBuffer = fs.readFileSync(AVIF_ENC_WASM);
      const avifEncWasmModule = await WebAssembly.compile(avifEncWasmBuffer);
      await initEncode(avifEncWasmModule);
    }

    return encode(image);
  },
};
