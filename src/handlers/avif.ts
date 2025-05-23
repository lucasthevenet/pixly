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
    if (isRunningInNode || isRunningInCloudFlareWorkers) {
      await initDecode(AVIF_DEC_WASM);
    }

    const result = await decode(buffer);

    if (!result) {
      throw new Error("Failed to decode");
    }

    return result;
  },
  async encode(image) {
    if (isRunningInNode || isRunningInCloudFlareWorkers) {
      await initEncode(AVIF_ENC_WASM);
    }

    return encode(image);
  },
};
