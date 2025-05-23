import resize, { initResize } from "@jsquash/resize";
import type { ImageData, Color, ImageFit, ImagePosition } from "../types";
import { getFrameDimensions } from "../utils/sizing";
import {
  isRunningInCloudFlareWorkers,
  isRunningInNode,
} from "../utils/environment";

const RESIZE_WASM =
  "node_modules/@jsquash/resize/lib/resize/pkg/squoosh_resize_bg.wasm";

export interface ResizeOptions {
  width: number | null;
  height: number | null;
  fit: ImageFit;
  position: ImagePosition;
  background: Color;
}

export const resizeImage = async (
  src: ImageData,
  opts: ResizeOptions,
): Promise<ImageData> => {
  if (!opts.width && !opts.height) {
    throw new Error("At least one dimension must be provided!");
  }

  if (isRunningInCloudFlareWorkers) {
    await initResize(RESIZE_WASM);
  }
  if (isRunningInNode) {
    const fs = await import("node:fs");
    const resizeWasmBuffer = fs.readFileSync(RESIZE_WASM);
    const resizeWasmModule = await WebAssembly.compile(resizeWasmBuffer);
    await initResize(resizeWasmModule);
  }

  const { frameWidth, frameHeight } = getFrameDimensions(
    src.width,
    src.height,
    opts.width,
    opts.height,
    opts.fit,
  );

  const dstBuffer = new Uint8ClampedArray(src.data.length);

  for (let i = 0; i < dstBuffer.length; i += 4) {
    if (dstBuffer[i + 3] === 0x0) {
      dstBuffer.set(opts.background, i);
    } else {
      dstBuffer.set(src.data.slice(i, i + 4), i);
    }
  }

  const resizedImageData = await resize(
    {
      width: src.width,
      height: src.height,
      data: new Uint8ClampedArray(src.data),
      colorSpace: "srgb",
    },
    {
      width: frameWidth,
      height: frameHeight,
      fitMethod: "stretch",
    },
  );

  return {
    data: resizedImageData.data,
    width: resizedImageData.width,
    height: resizedImageData.height,
    colorSpace: "srgb",
  };
};
