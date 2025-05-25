import { type OutputOptions, type ProcessingConfig, compose } from "./core";
import {
	type Pipeline,
	addOperation,
	createPipeline,
	processPipeline,
	processPipelineToBlob,
	processPipelineToDataURL,
} from "./pipeline";
import type { OperationFunction } from "./types";

export interface ImageEditor {
	apply: (op: OperationFunction) => ImageEditor;
	template: () => OperationFunction;
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

export const pixly = (config: ProcessingConfig = {}): ImageEditor => {
	const pipeline = createPipeline(config);

	const createBuilder = (currentPipeline: Pipeline): ImageEditor => ({
		apply: (op: OperationFunction) => {
			const newPipeline = addOperation(currentPipeline, op);
			return createBuilder(newPipeline);
		},
		template: () => {
			return compose(...currentPipeline.operations);
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
