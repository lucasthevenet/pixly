import type {
	Decoder,
	Encoder,
	ImageInput,
	Operation,
	OperationFunction,
} from "./types";
import { decodeFromBase64, encodeToBase64 } from "./utils/base64";

/** Configuration for creating an ImageBuilder */
interface BuilderConfig {
	decoder?: Decoder;
	encoder?: Encoder;
}

interface Pipeline {
	operations: Operation[];
	config: BuilderConfig;
}

type WithDecoder = { readonly _decoder: unique symbol };
type WithEncoder = { readonly _encoder: unique symbol };

/** Base image editor interface for presets (no encoder/decoder) */
interface PresetableImageEditor<TBrand = {}> {
	/** Apply an operation to the image processing chain */
	apply(operation: OperationFunction): ImageEditor<TBrand>;

	/** Set the decoder function for input processing */
	decoder(decoderFn: Decoder): ImageEditor<TBrand & WithDecoder>;

	/** Set the encoder function for output processing */
	encoder(encoderFn: Encoder): ImageEditor<TBrand & WithEncoder>;

	/** Create a preset from the current operation chain */
	preset(): OperationFunction;
}

/** Image editor with only decoder set */
interface DecoderOnlyImageEditor<TBrand> {
	/** Apply an operation to the image processing chain */
	apply(operation: OperationFunction): ImageEditor<TBrand>;

	/** Set the encoder function for output processing */
	encoder(encoderFn: Encoder): ImageEditor<TBrand & WithEncoder>;
}

/** Image editor with only encoder set */
interface EncoderOnlyImageEditor<TBrand> {
	/** Apply an operation to the image processing chain */
	apply(operation: OperationFunction): ImageEditor<TBrand>;

	/** Set the decoder function for input processing */
	decoder(decoderFn: Decoder): ImageEditor<TBrand & WithDecoder>;
}

/** Image editor that can process (has both encoder and decoder) */
interface ProcessableImageEditor<TBrand> {
	/** Apply an operation to the image processing chain */
	apply(operation: OperationFunction): ImageEditor<TBrand>;

	/** Process the input image with the configured operations */
	process(input: ImageInput): Promise<ProcessingResult>;
}

/** Union type that controls available methods based on configuration */
export type ImageEditor<TBrand = {}> = TBrand extends WithDecoder
	? TBrand extends WithEncoder
		? ProcessableImageEditor<TBrand> // Both: can only apply and process
		: DecoderOnlyImageEditor<TBrand> // Decoder only: can apply and set encoder
	: TBrand extends WithEncoder
		? EncoderOnlyImageEditor<TBrand> // Encoder only: can apply and set decoder
		: PresetableImageEditor<TBrand>; // Neither: can do everything except process

/** Result object returned after processing */
export interface ProcessingResult {
	/** Convert the processed image to a Uint8Array buffer */
	toBuffer(): Uint8Array;
	/** Convert the processed image to a Blob */
	toBlob(): Blob;
	/** Convert the processed image to a data URL string */
	toDataURL(): string;
}

const createBuilder = <TBrand = {}>(
	currentPipeline: Pipeline = {
		config: {},
		operations: [],
	},
): ImageEditor<TBrand> =>
	({
		apply: (op: OperationFunction) => {
			const newPipeline = addOperation(currentPipeline, op);
			return createBuilder<TBrand>(newPipeline);
		},
		preset: () => {
			return pipe(...currentPipeline.operations);
		},
		encoder: (encoderFn: Encoder) => {
			const newPipeline = setConfig(currentPipeline, { encoder: encoderFn });
			return createBuilder<TBrand & WithEncoder>(newPipeline);
		},
		decoder: (decoderFn: Decoder) => {
			const newPipeline = setConfig(currentPipeline, { decoder: decoderFn });
			return createBuilder<TBrand & WithDecoder>(newPipeline);
		},
		process: async (input: ImageInput) => {
			if (!currentPipeline.config.encoder || !currentPipeline.config.decoder) {
				throw new Error("Missing encoder or decoder");
			}
			const buffer = await normalizeImageInput(input);
			const decoded = await currentPipeline.config.decoder(
				buffer.buffer as ArrayBuffer,
			);
			const processed = await pipe(...currentPipeline.operations)(decoded.data);
			const result = await currentPipeline.config.encoder(processed);

			return {
				toBuffer: () => {
					return new Uint8Array(result.data);
				},

				toBlob: () => {
					return new Blob([result.data], { type: result.format });
				},

				toDataURL: () => {
					const bytes = new Uint8Array(result.data);
					const binary = encodeToBase64(bytes);

					return `data:${result.format};base64,${btoa(binary)}`;
				},
			};
		},
	}) as unknown as ImageEditor<TBrand>;

export const apply = createBuilder().apply;
export const decoder = createBuilder().decoder;
export const encoder = createBuilder().encoder;

const addOperation = (pipeline: Pipeline, operation: Operation): Pipeline => ({
	...pipeline,
	operations: [...pipeline.operations, operation],
});

const setConfig = (pipeline: Pipeline, config: BuilderConfig): Pipeline => ({
	...pipeline,
	config: {
		...pipeline.config,
		...config,
	},
});

const pipe =
	<T>(...fns: Array<(arg: T) => Promise<T>>) =>
	async (initial: T): Promise<T> => {
		let result = initial;
		for (const fn of fns) {
			result = await fn(result);
		}
		return result;
	};

async function normalizeImageInput(input: ImageInput) {
	let buffer: Uint8Array;

	if (typeof input === "string" && input.startsWith("data:")) {
		const base64 = input.split(",")[1]!;
		buffer = decodeFromBase64(base64);
	} else if (typeof input === "string") {
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

	return buffer;
}
