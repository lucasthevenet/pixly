import type { OutputOptions, ProcessingConfig } from "./core";
import {
	applyOperations,
	createImageProcessor,
	toBlob,
	toBuffer,
	toDataURL,
} from "./core";
import type { MimeType, Operation } from "./types";

export interface Pipeline {
	operations: Operation[];
	config: ProcessingConfig;
}

export interface PipelineTemplate {
	name: string;
	operations: Operation[];
	outputFormat: MimeType;
}

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
