import decode, { init as initDecode } from "@jsquash/jpeg/decode";
import encode, { init as initEncode } from "@jsquash/jpeg/encode";
import type { ImageHandler } from "../types";
import {
  isRunningInCloudFlareWorkers,
  isRunningInNode,
} from "../utils/environment";

const JPEG_ENC_WASM =
  "node_modules/@jsquash/jpeg/codec/enc/squoosh_jpeg_enc.wasm";
const JPEG_DEC_WASM =
  "node_modules/@jsquash/jpeg/codec/dec/squoosh_jpeg_dec.wasm";

export const JpegHandler: ImageHandler = {
  async decode(buffer) {
    if (isRunningInNode || isRunningInCloudFlareWorkers) {
      await initDecode(JPEG_DEC_WASM);
    }
    return decode(buffer);
  },
  async encode(image, options) {
    if (isRunningInNode || isRunningInCloudFlareWorkers) {
      await initEncode(JPEG_ENC_WASM);
    }
    return encode(image, options);
  },
};
