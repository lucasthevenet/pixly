import type {
	OutputOptions,
	Pipeline,
	PipelineTemplate,
	ProcessingConfig,
} from "./core";
import {
	applyOperations,
	createImageProcessor,
	crop,
	encodeProcessor,
	flip,
	resize,
	rotate,
	toBlob,
	toBuffer,
	toDataURL,
} from "./core";
import type { Operation } from "./types";
import type {
	Color,
	CropOptions,
	FlipDirection,
	ImageFit,
	ImagePosition,
	ResizeOptions,
} from "./types";

// Pipeline creation functions
export const createPipeline = (config: ProcessingConfig = {}): Pipeline => ({
	operations: [],
	config,
});

export const addOperation = (
	pipeline: Pipeline,
	operation: Operation,
): Pipeline => ({
	...pipeline,
	operations: [...pipeline.operations, operation],
});

export const addResize = (pipeline: Pipeline, opts: ResizeOptions): Pipeline =>
	addOperation(pipeline, resize(opts));

export const addRotate = (
	pipeline: Pipeline,
	angle: number,
	color: Color,
): Pipeline => addOperation(pipeline, rotate(angle, color));

export const addFlip = (
	pipeline: Pipeline,
	direction: FlipDirection,
): Pipeline => addOperation(pipeline, flip(direction));

export const addCrop = (pipeline: Pipeline, options: CropOptions): Pipeline =>
	addOperation(pipeline, crop(options));

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
	outputOpts: OutputOptions,
): Promise<Blob> => {
	const processor = await createImageProcessor(input, pipeline.config);
	const processedProcessor = await applyOperations(
		processor,
		pipeline.operations,
	);
	return toBlob(processedProcessor, outputOpts);
};

export const processPipelineToDataURL = async (
	pipeline: Pipeline,
	input: ArrayBuffer | Uint8Array | Blob | File | string,
	outputOpts: OutputOptions,
): Promise<string> => {
	const processor = await createImageProcessor(input, pipeline.config);
	const processedProcessor = await applyOperations(
		processor,
		pipeline.operations,
	);
	return toDataURL(processedProcessor, outputOpts);
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
		fit = "cover",
		position = "center",
		background = [255, 255, 255, 0],
	} = options || {};

	return addResize(createPipeline(), {
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
		fit = "inside",
		position = "center",
		background = [255, 255, 255, 0],
	} = options || {};

	return addResize(createPipeline(), {
		width: maxWidth,
		height: maxHeight,
		fit,
		position,
		background,
	});
};

export const createCompressionPipeline = (options?: {
	width?: number;
	height?: number;
	fit?: ImageFit;
	position?: ImagePosition;
	background?: Color;
}): Pipeline => {
	let pipeline = createPipeline();

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
	let pipeline = createPipeline();

	for (const operation of template.operations) {
		pipeline = addOperation(pipeline, operation);
	}

	return pipeline;
};
