import decode, { init as initDecode } from "@jsquash/webp/decode";
import encode, { init as initEncode } from "@jsquash/webp/encode";
import type { ImageHandler } from "../types";
import {
  isRunningInCloudFlareWorkers,
  isRunningInNode,
} from "../utils/environment";

const WEBP_ENC_WASM =
  "node_modules/@jsquash/webp/codec/enc/squoosh_webp_enc.wasm";
const WEBP_DEC_WASM =
  "node_modules/@jsquash/webp/codec/dec/squoosh_webp_dec.wasm";

export const WebpHandler: ImageHandler = {
  async decode(buffer) {
    if (isRunningInNode || isRunningInCloudFlareWorkers) {
      await initDecode(WEBP_DEC_WASM);
    }
    return decode(buffer);
  },
  async encode(image, options) {
    if (isRunningInNode || isRunningInCloudFlareWorkers) {
      await initEncode(WEBP_ENC_WASM);
    }
    return encode(image, options);
  },
};
