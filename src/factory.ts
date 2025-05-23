// Factory system for ImageKit functional implementation

import type { ProcessingConfig, OutputOptions, Pipeline } from "./core";
import type { Color, FlipDirection, CropOptions } from "./types";
import type { ResizeOptions } from "./operations/js-resize";
import {
  createPipeline,
  addResize,
  addRotate,
  addFlip,
  addCrop,
  processPipeline,
  processPipelineToBlob,
  processPipelineToDataURL,
} from "./pipeline";

// Functional Builder interface
export interface FunctionalBuilder {
  resize: (opts: ResizeOptions) => FunctionalBuilder;
  rotate: (angle: number, color: Color) => FunctionalBuilder;
  flip: (direction: FlipDirection) => FunctionalBuilder;
  crop: (options: CropOptions) => FunctionalBuilder;
  toBuffer: (
    input: ArrayBuffer | Uint8Array | Blob | File | string,
    opts: OutputOptions,
  ) => Promise<Uint8Array>;
  toBlob: (
    input: ArrayBuffer | Uint8Array | Blob | File | string,
    opts: OutputOptions,
  ) => Promise<Blob>;
  toDataURL: (
    input: ArrayBuffer | Uint8Array | Blob | File | string,
    opts: OutputOptions,
  ) => Promise<string>;
}

// Functional Builder implementation
export const createFunctionalBuilder = (
  config: ProcessingConfig = {},
): FunctionalBuilder => {
  const pipeline = createPipeline(config);

  const createBuilder = (currentPipeline: Pipeline): FunctionalBuilder => ({
    resize: (opts: ResizeOptions) => {
      const newPipeline = addResize(currentPipeline, opts);
      return createBuilder(newPipeline);
    },

    rotate: (angle: number, color: Color) => {
      const newPipeline = addRotate(currentPipeline, angle, color);
      return createBuilder(newPipeline);
    },

    flip: (direction: FlipDirection) => {
      const newPipeline = addFlip(currentPipeline, direction);
      return createBuilder(newPipeline);
    },

    crop: (options: CropOptions) => {
      const newPipeline = addCrop(currentPipeline, options);
      return createBuilder(newPipeline);
    },

    toBuffer: (
      input: ArrayBuffer | Uint8Array | Blob | File | string,
      opts: OutputOptions,
    ) => processPipeline(currentPipeline, input, opts),

    toBlob: (
      input: ArrayBuffer | Uint8Array | Blob | File | string,
      opts: OutputOptions,
    ) => processPipelineToBlob(currentPipeline, input, opts),

    toDataURL: (
      input: ArrayBuffer | Uint8Array | Blob | File | string,
      opts: OutputOptions,
    ) => processPipelineToDataURL(currentPipeline, input, opts),
  });

  return createBuilder(pipeline);
};
