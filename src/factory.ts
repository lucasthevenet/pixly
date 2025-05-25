import type { OutputOptions, ProcessingConfig } from "./core";
import { crop } from "./operations/crop";
import { flip } from "./operations/flip";
import { resize } from "./operations/resize";
import { rotate } from "./operations/rotate";
import {
	type Pipeline,
	addOperation,
	createPipeline,
	processPipeline,
	processPipelineToBlob,
	processPipelineToDataURL,
} from "./pipeline";
import type {
	Color,
	CropOptions,
	FlipDirection,
	OperationFunction,
	ResizeOptions,
} from "./types";

export interface ImageEditor {
	resize: (opts: ResizeOptions) => ImageEditor;
	rotate: (angle: number, color: Color) => ImageEditor;
	flip: (direction: FlipDirection) => ImageEditor;
	crop: (options: CropOptions) => ImageEditor;
	use: (op: OperationFunction) => ImageEditor;
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

export const createEditor = (config: ProcessingConfig = {}): ImageEditor => {
	const pipeline = createPipeline(config);

	const createBuilder = (currentPipeline: Pipeline): ImageEditor => ({
		resize: (opts: ResizeOptions) => {
			const newPipeline = addOperation(currentPipeline, resize(opts));
			return createBuilder(newPipeline);
		},

		rotate: (angle: number, color: Color) => {
			const newPipeline = addOperation(currentPipeline, rotate(angle, color));
			return createBuilder(newPipeline);
		},

		flip: (direction: FlipDirection) => {
			const newPipeline = addOperation(currentPipeline, flip(direction));
			return createBuilder(newPipeline);
		},

		crop: (options: CropOptions) => {
			const newPipeline = addOperation(currentPipeline, crop(options));
			return createBuilder(newPipeline);
		},

		use: (op: OperationFunction) => {
			const newPipeline = addOperation(currentPipeline, op);
			return createBuilder(newPipeline);
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
