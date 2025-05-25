/**
 * Type definitions for the new composable API
 */

import type { MimeType, OperationFunction, ImageInput } from "./types";

/** Decoder configuration for input processing */
export interface DecoderConfig {
	type: "auto" | MimeType;
	preserveMetadata?: boolean;
}

/** Encoder configuration for output processing */
export interface EncoderConfig {
	format: MimeType;
	quality?: number;
	compressionLevel?: number;
	loop?: number;
	delay?: number;
}

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
	
	/** Set the decoder configuration for input processing */
	decoder(config: DecoderConfig | "auto" | MimeType): ImageBuilder;
	
	/** Set the encoder configuration for output processing */
	encoder(config: EncoderConfig | MimeType): ImageBuilder;
	
	/** Create a preset from the current operation chain */
	preset(): Preset;
	
	/** Process the input image with the configured operations */
	process(input: ImageInput): Promise<ProcessingResult>;
}

/** Configuration for creating an ImageBuilder */
export interface BuilderConfig {
	decoder?: DecoderConfig | "auto" | MimeType;
	encoder?: EncoderConfig | MimeType;
	preserveMetadata?: boolean;
}

/** Helper type for decoder function signatures */
export type DecoderFunction = () => DecoderConfig | "auto" | MimeType;

/** Helper type for encoder function signatures */
export type EncoderFunction = (options?: Partial<EncoderConfig>) => EncoderConfig;

/** Format-specific encoder options */
export interface WebpEncoderOptions {
	quality?: number;
	compressionLevel?: number;
}

export interface JpegEncoderOptions {
	quality?: number;
}

export interface PngEncoderOptions {
	compressionLevel?: number;
}

export interface AvifEncoderOptions {
	quality?: number;
}

export interface JxlEncoderOptions {
	quality?: number;
}

export interface QoiEncoderOptions {
	// QOI format doesn't have configurable options
}

/** Internal state for the ImageBuilder */
export interface BuilderState {
	operations: OperationFunction[];
	decoderConfig: DecoderConfig;
	encoderConfig: EncoderConfig;
}