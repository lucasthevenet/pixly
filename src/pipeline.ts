// Pipeline system for ImageKit functional implementation

import type {
  Pipeline,
  PipelineTemplate,
  ImageOperation,
  ProcessingConfig,
  OutputOptions,
  ImageProcessor,
} from "./core";
import {
  createImageProcessor,
  applyOperations,
  toBuffer,
  toBlob,
  toDataURL,
} from "./core";
import type {
  Color,
  FlipDirection,
  CropOptions,
  ImageFit,
  ImagePosition,
} from "./types";
import type { ResizeOptions } from "./operations/js-resize";

// Pipeline creation functions
export const createPipeline = (config: ProcessingConfig = {}): Pipeline => ({
  operations: [],
  config,
});

export const addOperation = (
  pipeline: Pipeline,
  operation: ImageOperation,
): Pipeline => ({
  ...pipeline,
  operations: [...pipeline.operations, operation],
});

export const addResize = (pipeline: Pipeline, opts: ResizeOptions): Pipeline =>
  addOperation(pipeline, { type: "resize", params: opts });

export const addRotate = (
  pipeline: Pipeline,
  angle: number,
  color: Color,
): Pipeline =>
  addOperation(pipeline, { type: "rotate", params: { angle, color } });

export const addFlip = (
  pipeline: Pipeline,
  direction: FlipDirection,
): Pipeline => addOperation(pipeline, { type: "flip", params: { direction } });

export const addCrop = (pipeline: Pipeline, options: CropOptions): Pipeline =>
  addOperation(pipeline, { type: "crop", params: options });

// Pipeline execution
export const processPipeline = async (
  pipeline: Pipeline,
  input: ArrayBuffer | Uint8Array | Blob | File | string,
  outputOpts: OutputOptions,
): Promise<Uint8Array> => {
  const processor = await createImageProcessor(input, pipeline.config);
  const processedProcessor = await applyOperations(
    processor,
    pipeline.operations,
  );
  return toBuffer(processedProcessor, outputOpts);
};

export const processPipelineToBlob = async (
  pipeline: Pipeline,
  input: ArrayBuffer | Uint8Array | Blob | File | string,
  outputOpts?: OutputOptions,
): Promise<Blob> => {
  const defaultOpts: OutputOptions = {
    format: pipeline.config.encoder || "image/png",
    ...outputOpts,
  };

  const processor = await createImageProcessor(input, pipeline.config);
  const processedProcessor = await applyOperations(
    processor,
    pipeline.operations,
  );
  return toBlob(processedProcessor, defaultOpts);
};

export const processPipelineToDataURL = async (
  pipeline: Pipeline,
  input: ArrayBuffer | Uint8Array | Blob | File | string,
  outputOpts?: OutputOptions,
): Promise<string> => {
  const defaultOpts: OutputOptions = {
    format: pipeline.config.encoder || "image/png",
    ...outputOpts,
  };

  const processor = await createImageProcessor(input, pipeline.config);
  const processedProcessor = await applyOperations(
    processor,
    pipeline.operations,
  );
  return toDataURL(processedProcessor, defaultOpts);
};

// Preset pipeline factories
export const createThumbnailPipeline = (
  size = 150,
  options?: {
    quality?: number;
    fit?: ImageFit;
    position?: ImagePosition;
    background?: Color;
  },
): Pipeline => {
  const {
    quality = 80,
    fit = "cover",
    position = "center",
    background = [255, 255, 255, 0],
  } = options || {};

  return addResize(createPipeline({ encoder: "image/jpeg", quality }), {
    width: size,
    height: size,
    fit,
    position,
    background,
  });
};

export const createWebOptimizedPipeline = (
  maxWidth = 1920,
  options?: {
    maxHeight?: number;
    quality?: number;
    fit?: ImageFit;
    position?: ImagePosition;
    background?: Color;
  },
): Pipeline => {
  const {
    maxHeight = null,
    quality = 85,
    fit = "inside",
    position = "center",
    background = [255, 255, 255, 0],
  } = options || {};

  return addResize(createPipeline({ encoder: "image/webp", quality }), {
    width: maxWidth,
    height: maxHeight,
    fit,
    position,
    background,
  });
};

export const createCompressionPipeline = (
  quality = 60,
  options?: {
    width?: number;
    height?: number;
    fit?: ImageFit;
    position?: ImagePosition;
    background?: Color;
  },
): Pipeline => {
  let pipeline = createPipeline({ encoder: "image/jpeg", quality });

  if (options && (options.width || options.height)) {
    const {
      width = null,
      height = null,
      fit = "inside",
      position = "center",
      background = [255, 255, 255, 0],
    } = options;

    pipeline = addResize(pipeline, {
      width,
      height,
      fit,
      position,
      background,
    });
  }

  return pipeline;
};

// Template-based factory
export const createPipelineFromTemplate = (
  template: PipelineTemplate,
): Pipeline => {
  let pipeline = createPipeline({ encoder: template.outputFormat });

  for (const operation of template.operations) {
    pipeline = addOperation(pipeline, operation);
  }

  return pipeline;
};

// Strategy factories
export const createSpeedOptimizedPipeline = (
  config?: ProcessingConfig,
): Pipeline =>
  createPipeline({ encoder: "image/jpeg", quality: 70, ...config });

export const createQualityOptimizedPipeline = (
  config?: ProcessingConfig,
): Pipeline =>
  createPipeline({ encoder: "image/png", preserveMetadata: true, ...config });

export const createSizeOptimizedPipeline = (
  config?: ProcessingConfig,
): Pipeline =>
  createPipeline({ encoder: "image/webp", quality: 60, ...config });
