import decode, { init as initDecode } from "@jsquash/qoi/decode";
import encode, { init as initEncode } from "@jsquash/qoi/encode";
import type { ImageHandler } from "../types";
import {
  isRunningInCloudFlareWorkers,
  isRunningInNode,
} from "../utils/environment";

const JXL_ENC_WASM = "node_modules/@jsquash/qoi/codec/enc/squoosh_qoi_enc.wasm";
const JXL_DEC_WASM = "node_modules/@jsquash/qoi/codec/dec/squoosh_qoi_dec.wasm";

export const QoiHandler: ImageHandler = {
  async decode(buffer) {
    if (isRunningInNode || isRunningInCloudFlareWorkers) {
      await initDecode(JXL_DEC_WASM);
    }
    return decode(buffer);
  },
  async encode(image) {
    if (isRunningInNode || isRunningInCloudFlareWorkers) {
      await initEncode(JXL_ENC_WASM);
    }
    return encode(image);
  },
};
