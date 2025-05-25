/**
 * Type definitions for the new composable API
 */

import type { MimeType, OperationFunction, ImageInput, Decoder, Encoder } from "./types";

/** Preset operation - a composed operation that can be reused */
export type Preset = OperationFunction;

/** Result object returned after processing */
export interface ProcessingResult {
	/** Convert the processed image to a Uint8Array buffer */
	toBuffer(): Promise<Uint8Array>;
	/** Convert the processed image to a Blob */
	toBlob(): Promise<Blob>;
	/** Convert the processed image to a data URL string */
	toDataURL(): Promise<string>;
	/** Get the processed ImageData (for advanced usage) */
	getImageData(): ImageData;
}

/** Fluent image builder interface for the new composable API */
export interface ImageBuilder {
	/** Apply an operation to the image processing chain */
	apply(operation: OperationFunction): ImageBuilder;
	
	/** Set the decoder function for input processing */
	decoder(decoderFn: Decoder): ImageBuilder;
	
	/** Set the encoder function for output processing */
	encoder(encoderFn: Encoder): ImageBuilder;
	
	/** Create a preset from the current operation chain */
	preset(): Preset;
	
	/** Process the input image with the configured operations */
	process(input: ImageInput): Promise<ProcessingResult>;
}

/** Configuration for creating an ImageBuilder */
export interface BuilderConfig {
	decoder?: Decoder;
	encoder?: Encoder;
	preserveMetadata?: boolean;
}

/** Internal state for the ImageBuilder */
export interface BuilderState {
	operations: OperationFunction[];
	decoder: Decoder;
	encoder: Encoder;
}