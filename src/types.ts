export type MimeType =
	| "image/jpeg"
	| "image/png"
	| "image/webp"
	| "image/avif"
	| "image/jxl"
	| "image/qoi";

/** RGBA hex values 0...255 */
export type Color = [number, number, number, number];

export type ImageFit =
	/** Preserving aspect ratio, contain image within both provided dimensions using a border where necessary. */
	| "contain"
	/** Preserving aspect ratio, ensure the image covers both provided dimensions by cropping it to fit. */
	| "cover"
	/** Ignore the aspect ratio of the input and stretch to both provided dimensions. */
	| "fill"
	/** Preserving aspect ratio, resize the image to be as large as possible while ensuring its dimensions are less than or equal to both those specified. */
	| "inside"
	/** Preserving aspect ratio, resize the image to be as small as possible while ensuring its dimensions are greater than or equal to both those specified. */
	| "outside";

export type ImagePositionHorizontal = "left" | "center" | "right";
export type ImagePositionVertical = "top" | "center" | "bottom";
export type ImagePosition =
	| ImagePositionHorizontal
	| ImagePositionVertical
	| `${ImagePositionHorizontal} ${ImagePositionVertical}`;

export interface ResizeOptions {
	width: number | null;
	height: number | null;
	fit: ImageFit;
	position: ImagePosition;
	background: Color;
}

export type Decoder = (buffer: ArrayBuffer) => Promise<DecoderResult>;

export type DecoderResult = {
	format: MimeType;
	data: ImageData;
};

export type Encoder = (image: ImageData) => Promise<EncoderResult>;

export type EncoderResult = {
	format: MimeType;
	data: ArrayBuffer;
};

// Function-based operation types
export type OperationFunction = (bitmap: ImageData) => Promise<ImageData>;

// All operations are now functions
export type Operation = OperationFunction;

// Helper type for creating parameterized operations
export type OperationHandler<T> = (
	bitmap: ImageData,
	params: T,
) => Promise<ImageData>;

/** Input type for image processing */
export type ImageInput = ArrayBuffer | Uint8Array | Blob | File | string;
