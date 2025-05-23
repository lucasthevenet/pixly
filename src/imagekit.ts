import { AvifHandler } from "./handlers/avif";
import { JpegHandler } from "./handlers/jpeg";
import { JxlHandler } from "./handlers/jxl";
import { PngHandler } from "./handlers/png";
import { QoiHandler } from "./handlers/qoi";
import { WebpHandler } from "./handlers/webp";
import { cropImage } from "./operations/crop";
import { flipImage } from "./operations/flip";
import { resizeImage, type ResizeOptions } from "./operations/js-resize";
import { rotateImage } from "./operations/rotate";
import type {
  MimeType,
  ImageHandler,
  Color,
  FlipDirection,
  CropOptions,
  TransformOptions,
  ImageFit,
  ImagePosition,
} from "./types";

const typeHandlers: Record<MimeType, ImageHandler> = {
  "image/png": PngHandler,
  "image/jpeg": JpegHandler,
  "image/avif": AvifHandler,
  "image/webp": WebpHandler,
  "image/qoi": QoiHandler,
  "image/jxl": JxlHandler,
};

// Core types
export interface OutputOptions extends TransformOptions {
  format: MimeType;
}

export interface ProcessingConfig {
  decoder?: "auto" | MimeType;
  encoder?: MimeType;
  quality?: number;
  preserveMetadata?: boolean;
}

export interface ImageProcessor {
  buffer: Uint8Array;
  bitmap: ImageData | null;
  config: ProcessingConfig;
}

export interface Operation {
  type: "resize" | "rotate" | "flip" | "crop";
  params: unknown;
}

export interface ResizeOperation extends Operation {
  type: "resize";
  params: ResizeOptions;
}

export interface RotateOperation extends Operation {
  type: "rotate";
  params: { angle: number; color: Color };
}

export interface FlipOperation extends Operation {
  type: "flip";
  params: { direction: FlipDirection };
}

export interface CropOperation extends Operation {
  type: "crop";
  params: CropOptions;
}

export type ImageOperation =
  | ResizeOperation
  | RotateOperation
  | FlipOperation
  | CropOperation;

export interface Pipeline {
  operations: ImageOperation[];
  config: ProcessingConfig;
}

export interface PipelineTemplate {
  name: string;
  operations: ImageOperation[];
  outputFormat: MimeType;
}

// Core utility functions
export const getFormatFromMagicBytes = (
  magic: Uint8Array,
): MimeType | undefined => {
  if (
    magic[0] === 0x89 &&
    magic[1] === 0x50 &&
    magic[2] === 0x4e &&
    magic[3] === 0x47
  ) {
    return "image/png";
  }
  if (magic[0] === 0xff && magic[1] === 0xd8) {
    return "image/jpeg";
  }
  if (
    magic[0] === 0x52 &&
    magic[1] === 0x49 &&
    magic[2] === 0x46 &&
    magic[3] === 0x46 &&
    magic[8] === 0x57 &&
    magic[9] === 0x45 &&
    magic[10] === 0x42 &&
    magic[11] === 0x50
  ) {
    return "image/webp";
  }
  if (
    magic[0] === 0x00 &&
    magic[1] === 0x00 &&
    magic[2] === 0x00 &&
    magic[3] === 0x0c &&
    magic[4] === 0x6a &&
    magic[5] === 0x58 &&
    magic[6] === 0x4c &&
    magic[7] === 0x20
  ) {
    return "image/jxl";
  }
  if (
    magic[0] === 0x00 &&
    magic[1] === 0x00 &&
    magic[2] === 0x00 &&
    magic[3] === 0x1c &&
    magic[4] === 0x66 &&
    magic[5] === 0x74 &&
    magic[6] === 0x79 &&
    magic[7] === 0x70 &&
    magic[8] === 0x61 &&
    magic[9] === 0x76 &&
    magic[10] === 0x69 &&
    magic[11] === 0x66
  ) {
    return "image/avif";
  }
  if (
    magic[0] === 0x71 &&
    magic[1] === 0x6f &&
    magic[2] === 0x69 &&
    magic[3] === 0x66
  ) {
    return "image/qoi";
  }
  return undefined;
};

// Input loading function
export const loadInput = async (
  input: ArrayBuffer | Uint8Array | Blob | File | string,
  config: ProcessingConfig = {},
): Promise<{ buffer: Uint8Array; bitmap: ImageData | null }> => {
  let buffer: Uint8Array;

  if (typeof input === "string") {
    const res = await fetch(input);
    buffer = new Uint8Array(await res.arrayBuffer());
  } else if (input instanceof Blob || input instanceof File) {
    buffer = new Uint8Array(await input.arrayBuffer());
  } else if (input instanceof ArrayBuffer) {
    buffer = new Uint8Array(input);
  } else if (input instanceof Uint8Array) {
    buffer = input;
  } else {
    throw new Error("Unsupported input type");
  }

  let bitmap: ImageData | null = null;
  try {
    const magic = buffer.slice(0, 16);
    const format =
      config.decoder === "auto" || !config.decoder
        ? (getFormatFromMagicBytes(magic) ?? "image/png")
        : config.decoder;

    if (format in typeHandlers) {
      const result = await typeHandlers[format].decode(
        buffer.buffer as ArrayBuffer,
      );
      if (result) {
        bitmap = result;
      }
    }
  } catch (err) {
    console.log(err);
    bitmap = null;
  }

  return { buffer, bitmap };
};

// Core processor creation function
export const createImageProcessor = async (
  input: ArrayBuffer | Uint8Array | Blob | File | string,
  config: ProcessingConfig = {},
): Promise<ImageProcessor> => {
  const { buffer, bitmap } = await loadInput(input, config);
  return { buffer, bitmap, config };
};

// Operation application functions
export const applyOperation = async (
  processor: ImageProcessor,
  operation: ImageOperation,
): Promise<ImageProcessor> => {
  if (!processor.bitmap) {
    return {
      ...processor,
    };
  }

  let newBitmap = processor.bitmap;

  switch (operation.type) {
    case "resize":
      newBitmap = await resizeImage(newBitmap, operation.params);
      break;
    case "rotate":
      newBitmap = await rotateImage(
        newBitmap,
        operation.params.angle,
        operation.params.color,
      );
      break;
    case "flip":
      newBitmap = await flipImage(newBitmap, operation.params.direction);
      break;
    case "crop":
      newBitmap = await cropImage(newBitmap, operation.params);
      break;
  }

  return {
    ...processor,
    bitmap: newBitmap,
  };
};

export const applyOperations = async (
  processor: ImageProcessor,
  operations: ImageOperation[],
): Promise<ImageProcessor> => {
  let currentProcessor = processor;
  for (const operation of operations) {
    currentProcessor = await applyOperation(currentProcessor, operation);
  }
  return currentProcessor;
};

// Encoding functions
export const encodeProcessor = async (
  processor: ImageProcessor,
  opts: OutputOptions,
): Promise<Uint8Array> => {
  const format = processor.config.encoder || opts.format;
  const handler = typeHandlers[format];

  if (!handler || !processor.bitmap) {
    throw new Error("Failed to encode into format");
  }

  const encodeOptions = {
    width: processor.bitmap.width,
    height: processor.bitmap.height,
    quality: processor.config.quality,
    ...opts,
  };

  const result = await handler.encode(processor.bitmap, encodeOptions);
  return new Uint8Array(result);
};

export const toBuffer = async (
  processor: ImageProcessor,
  opts: OutputOptions,
): Promise<Uint8Array> => {
  if (!processor.bitmap) return processor.buffer;
  return encodeProcessor(processor, opts);
};

export const toBlob = async (
  processor: ImageProcessor,
  opts: OutputOptions,
): Promise<Blob> => {
  const buffer = await toBuffer(processor, opts);
  const format = processor.config.encoder || opts.format;
  return new Blob([buffer], { type: format });
};

export const toDataURL = async (
  processor: ImageProcessor,
  opts: OutputOptions,
): Promise<string> => {
  const buffer = await toBuffer(processor, opts);
  const format = processor.config.encoder || opts.format;
  const base64 = btoa(String.fromCharCode(...buffer));
  return `data:${format};base64,${base64}`;
};

// Operation factory functions (curried for composition)
export const resize =
  (opts: ResizeOptions) =>
  (processor: ImageProcessor): Promise<ImageProcessor> =>
    applyOperation(processor, { type: "resize", params: opts });

export const rotate =
  (angle: number, color: Color) =>
  (processor: ImageProcessor): Promise<ImageProcessor> =>
    applyOperation(processor, { type: "rotate", params: { angle, color } });

export const flip =
  (direction: FlipDirection) =>
  (processor: ImageProcessor): Promise<ImageProcessor> =>
    applyOperation(processor, { type: "flip", params: { direction } });

export const crop =
  (options: CropOptions) =>
  (processor: ImageProcessor): Promise<ImageProcessor> =>
    applyOperation(processor, { type: "crop", params: options });

// Composition utilities
export const pipe =
  <T>(...fns: Array<(arg: T) => Promise<T>>) =>
  async (initial: T): Promise<T> => {
    let result = initial;
    for (const fn of fns) {
      result = await fn(result);
    }
    return result;
  };

export const compose = <T>(...fns: Array<(arg: T) => Promise<T>>) =>
  pipe(...fns.reverse());

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

// Factory functions
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

// Preset pipeline factories
export const createThumbnailPipeline = (size = 150): Pipeline =>
  addResize(createPipeline({ encoder: "image/jpeg", quality: 80 }), {
    width: size,
    height: size,
    fit: "cover",
    position: "center",
    background: [255, 255, 255, 0],
  });

export const createWebOptimizedPipeline = (maxWidth = 1920): Pipeline =>
  addResize(createPipeline({ encoder: "image/webp", quality: 85 }), {
    width: maxWidth,
    height: null,
    fit: "inside",
    position: "center",
    background: [255, 255, 255, 0],
  });

export const createCompressionPipeline = (quality = 60): Pipeline =>
  createPipeline({ encoder: "image/jpeg", quality });

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

// Functional Builder Pattern (for those who prefer method chaining)
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

// Convenience exports that mimic the original API
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

export const ImageKitPipeline = {
  create: createPipeline,
  createThumbnail: createThumbnailPipeline,
  createWebOptimized: createWebOptimizedPipeline,
  createCompression: createCompressionPipeline,
  createFromTemplate: createPipelineFromTemplate,
  createSpeedOptimized: createSpeedOptimizedPipeline,
  createQualityOptimized: createQualityOptimizedPipeline,
  createSizeOptimized: createSizeOptimizedPipeline,
};

export const ImageKitFactory = {
  createBuilder: createFunctionalBuilder,
  createPipeline,
  createThumbnailPipeline,
  createWebOptimizedPipeline,
  createCompressionPipeline,
  createPipelineFromTemplate,
};
