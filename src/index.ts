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
	blur,
	pipe,
	compose,
	getFormatFromMagicBytes,
	loadInput,
} from "./core";

export {
	createOperation,
	createSafeOperation,
	isOperationFunction,
	validateOperationParams,
	composeOperations,
	createConditionalOperation,
} from "./operations/custom";

export { adjustChannels } from "./operations/adjust-channels";
export { brightness } from "./operations/brightness";
export { contrast } from "./operations/contrast";
export { grayscale } from "./operations/grayscale";
export { sepia } from "./operations/sepia";
export { invert } from "./operations/invert";
export { tint } from "./operations/tint";
export { sharpen } from "./operations/sharpen";
export { pixelate } from "./operations/pixelate";

export type {
	OutputOptions,
	ProcessingConfig,
	ImageProcessor,
	Pipeline,
	PipelineTemplate,
} from "./core";

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
} from "./pipeline";

export { createFunctionalBuilder } from "./factory";

export type { FunctionalBuilder } from "./factory";

export type {
	MimeType,
	Color,
	FlipDirection,
	CropOptions,
	TransformOptions,
	ImageFit,
	ResizeOptions,
	ImagePosition,
	Operation,
	OperationFunction,
	OperationHandler,
} from "./types";

export type { ChannelOptions } from "./operations/adjust-channels";
export type { GrayscaleOptions } from "./operations/grayscale";
export type { TintOptions } from "./operations/tint";
