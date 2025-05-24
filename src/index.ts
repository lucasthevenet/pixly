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
	createOperation,
	loadInput,
} from "./core";

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
