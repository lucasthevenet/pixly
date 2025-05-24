import { AvifHandler } from "./handlers/avif";
import { JpegHandler } from "./handlers/jpeg";
import { JxlHandler } from "./handlers/jxl";
import { PngHandler } from "./handlers/png";
import { QoiHandler } from "./handlers/qoi";
import { WebpHandler } from "./handlers/webp";
import { blurImage } from "./operations/blur";
import { cropImage } from "./operations/crop";
import { flipImage } from "./operations/flip";
import { resizeImage } from "./operations/resize";
import { resizeImageWasm } from "./operations/resize-wasm";
import { rotateImage } from "./operations/rotate";
import type {
	Color,
	CropOptions,
	FlipDirection,
	ImageHandler,
	MimeType,
	Operation,
	OperationFunction,
	OperationHandler,
	ResizeOptions,
	TransformOptions,
} from "./types";

export const typeHandlers: Record<MimeType, ImageHandler> = {
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
	preserveMetadata?: boolean;
}

export interface ImageProcessor {
	buffer: Uint8Array;
	bitmap: ImageData | null;
	config: ProcessingConfig;
}

export interface Pipeline {
	operations: Operation[];
	config: ProcessingConfig;
}

export interface PipelineTemplate {
	name: string;
	operations: Operation[];
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
	operation: Operation,
): Promise<ImageProcessor> => {
	if (!processor.bitmap) {
		return {
			...processor,
		};
	}

	try {
		const newBitmap = await operation(processor.bitmap);
		return {
			...processor,
			bitmap: newBitmap,
		};
	} catch (error) {
		throw new Error(
			`Operation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
};

export const applyOperations = async (
	processor: ImageProcessor,
	operations: Operation[],
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
	const format = opts.format;
	const handler = typeHandlers[format];

	if (!handler || !processor.bitmap) {
		throw new Error("Failed to encode into format");
	}

	const encodeOptions = {
		width: processor.bitmap.width,
		height: processor.bitmap.height,
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
	const format = opts.format;
	return new Blob([buffer], { type: format });
};

export const toDataURL = async (
	processor: ImageProcessor,
	opts: OutputOptions,
): Promise<string> => {
	const buffer = await toBuffer(processor, opts);
	const format = opts.format;
	const base64 = btoa(String.fromCharCode(...buffer));
	return `data:${format};base64,${base64}`;
};

// Operation factory functions (new function-based style)
export const resize = (opts: ResizeOptions): OperationFunction =>
	createOperation(resizeImage, opts);

export const rotate = (angle: number, color: Color): OperationFunction =>
	createOperation(
		(bitmap, params) => rotateImage(bitmap, params.degrees, params.background),
		{ degrees: angle, background: color },
	);

export const flip = (direction: FlipDirection): OperationFunction =>
	createOperation(flipImage, direction);

export const crop = (options: CropOptions): OperationFunction =>
	createOperation(cropImage, options);

export const blur = (radius: number): OperationFunction =>
	createOperation(blurImage, radius);

export function createOperation<T>(
	handler: OperationHandler<T>,
	params: T,
): OperationFunction {
	return (bitmap: ImageData) => handler(bitmap, params);
}

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
