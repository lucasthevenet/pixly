// Main index file for ImageKit functional implementation

// Re-export core functionality
export {
  createImageProcessor,
  applyOperation,
  applyOperations,
  encodeProcessor,
  toBuffer,
  toBlob,
  toDataURL,
  resize,
  rotate,
  flip,
  crop,
  pipe,
  compose,
  getFormatFromMagicBytes,
  loadInput,
} from "./core";

// Re-export types
export type {
  OutputOptions,
  ProcessingConfig,
  ImageProcessor,
  Operation,
  ResizeOperation,
  RotateOperation,
  FlipOperation,
  CropOperation,
  ImageOperation,
  Pipeline,
  PipelineTemplate,
} from "./core";

// Re-export pipeline functionality
export {
  createPipeline,
  addOperation,
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
  createSpeedOptimizedPipeline,
  createQualityOptimizedPipeline,
  createSizeOptimizedPipeline,
  ImageKitPipeline,
} from "./pipeline";

// Re-export factory functionality
export {
  createImageProcessorFromFile,
  createImageProcessorFromUrl,
  createImageProcessorFromBuffer,
  createImageProcessorFromBlob,
  createPngProcessor,
  createJpegProcessor,
  createWebpProcessor,
  createAvifProcessor,
  createFunctionalBuilder,
  ImageKit,
  ImageKitFactory,
} from "./factory";

// Re-export functional builder type
export type { FunctionalBuilder } from "./factory";

// Re-export relevant types from operations and base types
export type { ResizeOptions } from "./operations/js-resize";
export type {
  MimeType,
  Color,
  FlipDirection,
  CropOptions,
  TransformOptions,
  ImageFit,
  ImagePosition,
} from "./types";