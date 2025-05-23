import decode, { init as initDecode } from "@jsquash/qoi/decode";
import encode, { init as initEncode } from "@jsquash/qoi/encode";
import type { ImageHandler } from "../types";
import {
  isRunningInCloudFlareWorkers,
  isRunningInNode,
} from "../utils/environment";

const QOI_ENC_WASM = "node_modules/@jsquash/qoi/codec/enc/squoosh_qoi_enc.wasm";
const QOI_DEC_WASM = "node_modules/@jsquash/qoi/codec/dec/squoosh_qoi_dec.wasm";

export const QoiHandler: ImageHandler = {
  async decode(buffer) {
    if (isRunningInCloudFlareWorkers) {
      await initDecode(QOI_DEC_WASM);
    }
    if (isRunningInNode) {
      const fs = await import("node:fs");
      const qoiDecWasmBuffer = fs.readFileSync(QOI_DEC_WASM);
      const qoiDecWasmModule = await WebAssembly.compile(qoiDecWasmBuffer);
      await initDecode(qoiDecWasmModule);
    }

    return decode(buffer);
  },
  async encode(image) {
    if (isRunningInCloudFlareWorkers) {
      await initEncode(QOI_ENC_WASM);
    }

    if (isRunningInNode) {
      const fs = await import("node:fs");
      const qoiEncWasmBuffer = fs.readFileSync(QOI_ENC_WASM);
      const qoiEncWasmModule = await WebAssembly.compile(qoiEncWasmBuffer);
      await initEncode(qoiEncWasmModule);
    }

    return encode(image);
  },
};
