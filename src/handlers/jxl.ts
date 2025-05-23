import decode, { init as initDecode } from "@jsquash/jxl/decode";
import encode, { init as initEncode } from "@jsquash/jxl/encode";
import type { ImageHandler } from "../types";
import {
  isRunningInCloudFlareWorkers,
  isRunningInNode,
} from "../utils/environment";

const JXL_ENC_WASM = "node_modules/@jsquash/jxl/codec/enc/squoosh_jxl_enc.wasm";
const JXL_DEC_WASM = "node_modules/@jsquash/jxl/codec/dec/squoosh_jxl_dec.wasm";

export const JxlHandler: ImageHandler = {
  async decode(buffer) {
    if (isRunningInNode || isRunningInCloudFlareWorkers) {
      await initDecode(JXL_DEC_WASM);
    }
    return decode(buffer);
  },
  async encode(image, options) {
    if (isRunningInNode || isRunningInCloudFlareWorkers) {
      await initEncode(JXL_ENC_WASM);
    }
    return encode(image, options);
  },
};
