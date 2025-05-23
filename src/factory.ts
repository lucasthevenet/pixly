// Factory system for ImageKit functional implementation

import type {
  ProcessingConfig,
  OutputOptions,
  ImageProcessor,
  Pipeline,
  PipelineTemplate,
} from "./core";
import { createImageProcessor } from "./core";
import type {
  Color,
  FlipDirection,
  CropOptions,
  ImageFit,
  ImagePosition,
} from "./types";
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
  createThumbnailPipeline,
  createWebOptimizedPipeline,
  createCompressionPipeline,
  createPipelineFromTemplate,
} from "./pipeline";

// Factory functions for different input types
export const createImageProcessorFromFile =
  (config?: ProcessingConfig) => (file: File) =>
    createImageProcessor(file, config);

export const createImageProcessorFromUrl =
  (config?: ProcessingConfig) => (url: string) =>
    createImageProcessor(url, config);

export const createImageProcessorFromBuffer =
  (config?: ProcessingConfig) => (buffer: ArrayBuffer | Uint8Array) =>
    createImageProcessor(buffer, config);

export const createImageProcessorFromBlob =
  (config?: ProcessingConfig) => (blob: Blob) =>
    createImageProcessor(blob, config);

// Format-specific factories
export const createPngProcessor = (
  input: ArrayBuffer | Uint8Array | Blob | File | string,
) => createImageProcessor(input, { decoder: "image/png" });

export const createJpegProcessor = (
  input: ArrayBuffer | Uint8Array | Blob | File | string,
) => createImageProcessor(input, { decoder: "image/jpeg" });

export const createWebpProcessor = (
  input: ArrayBuffer | Uint8Array | Blob | File | string,
) => createImageProcessor(input, { decoder: "image/webp" });

export const createAvifProcessor = (
  input: ArrayBuffer | Uint8Array | Blob | File | string,
) => createImageProcessor(input, { decoder: "image/avif" });

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
    opts?: OutputOptions,
  ) => Promise<Blob>;
  toDataURL: (
    input: ArrayBuffer | Uint8Array | Blob | File | string,
    opts?: OutputOptions,
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
      opts?: OutputOptions,
    ) => processPipelineToBlob(currentPipeline, input, opts),

    toDataURL: (
      input: ArrayBuffer | Uint8Array | Blob | File | string,
      opts?: OutputOptions,
    ) => processPipelineToDataURL(currentPipeline, input, opts),
  });

  return createBuilder(pipeline);
};

// Main factory objects
export const ImageKit = {
  from: createImageProcessor,
  fromFile: createImageProcessorFromFile(),
  fromUrl: createImageProcessorFromUrl(),
  fromBuffer: createImageProcessorFromBuffer(),
  fromBlob: createImageProcessorFromBlob(),
  fromPng: createPngProcessor,
  fromJpeg: createJpegProcessor,
  fromWebp: createWebpProcessor,
  fromAvif: createAvifProcessor,
};

export const ImageKitFactory = {
  createBuilder: createFunctionalBuilder,
  createPipeline,
  createThumbnailPipeline,
  createWebOptimizedPipeline,
  createCompressionPipeline,
  createPipelineFromTemplate,
};
