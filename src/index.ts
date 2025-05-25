import "./utils/polyfill";
export {
	createImageProcessor,
	applyOperation,
	applyOperations,
	encodeProcessor,
	toBuffer,
	toBlob,
	toDataURL,
	pipe,
	compose,
	getFormatFromMagicBytes,
	loadInput,
} from "./core";

export type {
	OutputOptions,
	ProcessingConfig,
	ImageProcessor,
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
export { resize } from "./operations/resize";
export { rotate } from "./operations/rotate";
export { flip } from "./operations/flip";
export { crop } from "./operations/crop";
export { blur } from "./operations/blur";

export type { ChannelOptions } from "./operations/adjust-channels";
export type { GrayscaleOptions } from "./operations/grayscale";
export type { TintOptions } from "./operations/tint";

export {
	createPipeline,
	addOperation,
	processPipeline,
	processPipelineToBlob,
	processPipelineToDataURL,
} from "./pipeline";

export type {
	Pipeline,
	PipelineTemplate,
} from "./pipeline";

export { createEditor } from "./factory";

export type { ImageEditor } from "./factory";

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
