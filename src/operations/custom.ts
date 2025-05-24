import type { ImageData } from "../types";
import type { OperationFunction, OperationHandler } from "../types";

/**
 * Enhanced operation creation utility with better type inference and validation
 */
export function createOperation<T = void>(
	handler: T extends void
		? (bitmap: ImageData) => Promise<ImageData>
		: OperationHandler<T>,
	...args: T extends void ? [] : [T]
): OperationFunction {
	const params = args[0];
	return (bitmap: ImageData) => {
		if (params === undefined) {
			return (handler as (bitmap: ImageData) => Promise<ImageData>)(bitmap);
		}
		return (handler as OperationHandler<T>)(bitmap, params);
	};
}

/**
 * Type guard to check if a value is an operation function
 */
export function isOperationFunction(value: unknown): value is OperationFunction {
	return typeof value === "function" && value.length === 1;
}

/**
 * Validate operation parameters at runtime
 */
export function validateOperationParams<T>(
	params: T,
	validator: (params: T) => boolean,
	errorMessage: string,
): asserts params is T {
	if (!validator(params)) {
		throw new Error(`Invalid operation parameters: ${errorMessage}`);
	}
}

/**
 * Create a safe operation wrapper that handles errors gracefully
 */
export function createSafeOperation<T = void>(
	handler: T extends void
		? (bitmap: ImageData) => Promise<ImageData>
		: OperationHandler<T>,
	fallback?: (bitmap: ImageData, error: Error) => Promise<ImageData>,
	...args: T extends void ? [] : [T]
): OperationFunction {
	const operation = createOperation(handler, ...args);
	
	return async (bitmap: ImageData): Promise<ImageData> => {
		try {
			return await operation(bitmap);
		} catch (error) {
			if (fallback) {
				return await fallback(bitmap, error as Error);
			}
			console.warn(`Operation failed, returning original bitmap:`, error);
			return bitmap;
		}
	};
}

/**
 * Compose multiple operations into a single operation
 */
export function composeOperations(...operations: OperationFunction[]): OperationFunction {
	return async (bitmap: ImageData): Promise<ImageData> => {
		let result = bitmap;
		for (const operation of operations) {
			result = await operation(result);
		}
		return result;
	};
}

/**
 * Create a conditional operation that only applies if a condition is met
 */
export function createConditionalOperation(
	condition: (bitmap: ImageData) => boolean,
	operation: OperationFunction,
	elseOperation?: OperationFunction,
): OperationFunction {
	return async (bitmap: ImageData): Promise<ImageData> => {
		if (condition(bitmap)) {
			return await operation(bitmap);
		}
		if (elseOperation) {
			return await elseOperation(bitmap);
		}
		return bitmap;
	};
}

// Common operation patterns and utilities

/**
 * Channel manipulation utilities
 */
export interface ChannelOptions {
	red?: number;
	green?: number;
	blue?: number;
	alpha?: number;
}

export function adjustChannels(options: ChannelOptions): OperationFunction {
	return createOperation(
		async (bitmap: ImageData, params: ChannelOptions): Promise<ImageData> => {
			const newData = new Uint8ClampedArray(bitmap.data);
			
			for (let i = 0; i < newData.length; i += 4) {
				if (params.red !== undefined) {
					newData[i] = Math.min(255, Math.max(0, newData[i] * params.red));
				}
				if (params.green !== undefined) {
					newData[i + 1] = Math.min(255, Math.max(0, newData[i + 1] * params.green));
				}
				if (params.blue !== undefined) {
					newData[i + 2] = Math.min(255, Math.max(0, newData[i + 2] * params.blue));
				}
				if (params.alpha !== undefined) {
					newData[i + 3] = Math.min(255, Math.max(0, newData[i + 3] * params.alpha));
				}
			}
			
			return new ImageData(newData, bitmap.width, bitmap.height);
		},
		options,
	);
}

/**
 * Brightness adjustment
 */
export function brightness(amount: number): OperationFunction {
	validateOperationParams(
		amount,
		(val) => val >= -255 && val <= 255,
		"Brightness must be between -255 and 255",
	);
	
	return createOperation(
		async (bitmap: ImageData, brightness: number): Promise<ImageData> => {
			const newData = new Uint8ClampedArray(bitmap.data);
			
			for (let i = 0; i < newData.length; i += 4) {
				newData[i] = Math.min(255, Math.max(0, newData[i] + brightness));
				newData[i + 1] = Math.min(255, Math.max(0, newData[i + 1] + brightness));
				newData[i + 2] = Math.min(255, Math.max(0, newData[i + 2] + brightness));
			}
			
			return new ImageData(newData, bitmap.width, bitmap.height);
		},
		amount,
	);
}

/**
 * Contrast adjustment
 */
export function contrast(amount: number): OperationFunction {
	validateOperationParams(
		amount,
		(val) => val >= -1 && val <= 1,
		"Contrast must be between -1 and 1",
	);
	
	return createOperation(
		async (bitmap: ImageData, contrast: number): Promise<ImageData> => {
			const newData = new Uint8ClampedArray(bitmap.data);
			const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
			
			for (let i = 0; i < newData.length; i += 4) {
				newData[i] = Math.min(255, Math.max(0, factor * (newData[i] - 128) + 128));
				newData[i + 1] = Math.min(255, Math.max(0, factor * (newData[i + 1] - 128) + 128));
				newData[i + 2] = Math.min(255, Math.max(0, factor * (newData[i + 2] - 128) + 128));
			}
			
			return new ImageData(newData, bitmap.width, bitmap.height);
		},
		amount,
	);
}

/**
 * Grayscale conversion with different methods
 */
export interface GrayscaleOptions {
	method: "average" | "luminance" | "desaturation" | "red" | "green" | "blue";
}

export function grayscale(options: GrayscaleOptions = { method: "luminance" }): OperationFunction {
	return createOperation(
		async (bitmap: ImageData, params: GrayscaleOptions): Promise<ImageData> => {
			const newData = new Uint8ClampedArray(bitmap.data);
			
			for (let i = 0; i < newData.length; i += 4) {
				const r = newData[i];
				const g = newData[i + 1];
				const b = newData[i + 2];
				
				let gray: number;
				switch (params.method) {
					case "average":
						gray = (r + g + b) / 3;
						break;
					case "luminance":
						gray = 0.299 * r + 0.587 * g + 0.114 * b;
						break;
					case "desaturation":
						gray = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
						break;
					case "red":
						gray = r;
						break;
					case "green":
						gray = g;
						break;
					case "blue":
						gray = b;
						break;
					default:
						gray = 0.299 * r + 0.587 * g + 0.114 * b;
				}
				
				newData[i] = gray;
				newData[i + 1] = gray;
				newData[i + 2] = gray;
			}
			
			return new ImageData(newData, bitmap.width, bitmap.height);
		},
		options,
	);
}

/**
 * Sepia tone effect
 */
export function sepia(intensity: number = 1): OperationFunction {
	validateOperationParams(
		intensity,
		(val) => val >= 0 && val <= 1,
		"Sepia intensity must be between 0 and 1",
	);
	
	return createOperation(
		async (bitmap: ImageData, intensity: number): Promise<ImageData> => {
			const newData = new Uint8ClampedArray(bitmap.data);
			
			for (let i = 0; i < newData.length; i += 4) {
				const r = newData[i];
				const g = newData[i + 1];
				const b = newData[i + 2];
				
				const newR = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
				const newG = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
				const newB = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
				
				newData[i] = r + intensity * (newR - r);
				newData[i + 1] = g + intensity * (newG - g);
				newData[i + 2] = b + intensity * (newB - b);
			}
			
			return new ImageData(newData, bitmap.width, bitmap.height);
		},
		intensity,
	);
}

/**
 * Invert colors
 */
export function invert(): OperationFunction {
	return createOperation(
		async (bitmap: ImageData): Promise<ImageData> => {
			const newData = new Uint8ClampedArray(bitmap.data);
			
			for (let i = 0; i < newData.length; i += 4) {
				newData[i] = 255 - newData[i];     // Red
				newData[i + 1] = 255 - newData[i + 1]; // Green
				newData[i + 2] = 255 - newData[i + 2]; // Blue
			}
			
			return new ImageData(newData, bitmap.width, bitmap.height);
		},
	);
}

/**
 * Apply a color tint
 */
export interface TintOptions {
	red: number;
	green: number;
	blue: number;
	opacity: number;
}

export function tint(options: TintOptions): OperationFunction {
	validateOperationParams(
		options,
		(opts) => 
			opts.red >= 0 && opts.red <= 255 &&
			opts.green >= 0 && opts.green <= 255 &&
			opts.blue >= 0 && opts.blue <= 255 &&
			opts.opacity >= 0 && opts.opacity <= 1,
		"Tint values must be valid (RGB: 0-255, opacity: 0-1)",
	);
	
	return createOperation(
		async (bitmap: ImageData, params: TintOptions): Promise<ImageData> => {
			const newData = new Uint8ClampedArray(bitmap.data);
			
			for (let i = 0; i < newData.length; i += 4) {
				newData[i] = newData[i] + params.opacity * (params.red - newData[i]);
				newData[i + 1] = newData[i + 1] + params.opacity * (params.green - newData[i + 1]);
				newData[i + 2] = newData[i + 2] + params.opacity * (params.blue - newData[i + 2]);
			}
			
			return new ImageData(newData, bitmap.width, bitmap.height);
		},
		options,
	);
}

/**
 * Simple sharpening filter (unsharp mask)
 */
export function sharpen(intensity: number = 1): OperationFunction {
	validateOperationParams(
		intensity,
		(val) => val >= 0 && val <= 2,
		"Sharpen intensity must be between 0 and 2",
	);
	
	return createOperation(
		async (bitmap: ImageData, intensity: number): Promise<ImageData> => {
			const width = bitmap.width;
			const height = bitmap.height;
			const newData = new Uint8ClampedArray(bitmap.data);
			
			// Simple 3x3 sharpening kernel
			const kernel = [
				0, -intensity, 0,
				-intensity, 1 + 4 * intensity, -intensity,
				0, -intensity, 0
			];
			
			for (let y = 1; y < height - 1; y++) {
				for (let x = 1; x < width - 1; x++) {
					for (let c = 0; c < 3; c++) { // RGB channels only
						let sum = 0;
						for (let ky = -1; ky <= 1; ky++) {
							for (let kx = -1; kx <= 1; kx++) {
								const pos = ((y + ky) * width + (x + kx)) * 4 + c;
								const kernelPos = (ky + 1) * 3 + (kx + 1);
								sum += bitmap.data[pos] * kernel[kernelPos];
							}
						}
						const pos = (y * width + x) * 4 + c;
						newData[pos] = Math.min(255, Math.max(0, sum));
					}
				}
			}
			
			return new ImageData(newData, bitmap.width, bitmap.height);
		},
		intensity,
	);
}

/**
 * Pixelate effect
 */
export function pixelate(blockSize: number): OperationFunction {
	validateOperationParams(
		blockSize,
		(val) => val >= 1 && val <= 100,
		"Block size must be between 1 and 100",
	);
	
	return createOperation(
		async (bitmap: ImageData, blockSize: number): Promise<ImageData> => {
			const width = bitmap.width;
			const height = bitmap.height;
			const newData = new Uint8ClampedArray(bitmap.data);
			
			for (let y = 0; y < height; y += blockSize) {
				for (let x = 0; x < width; x += blockSize) {
					// Calculate average color for the block
					let r = 0, g = 0, b = 0, a = 0, count = 0;
					
					for (let by = y; by < Math.min(y + blockSize, height); by++) {
						for (let bx = x; bx < Math.min(x + blockSize, width); bx++) {
							const pos = (by * width + bx) * 4;
							r += bitmap.data[pos];
							g += bitmap.data[pos + 1];
							b += bitmap.data[pos + 2];
							a += bitmap.data[pos + 3];
							count++;
						}
					}
					
					r = Math.round(r / count);
					g = Math.round(g / count);
					b = Math.round(b / count);
					a = Math.round(a / count);
					
					// Apply average color to entire block
					for (let by = y; by < Math.min(y + blockSize, height); by++) {
						for (let bx = x; bx < Math.min(x + blockSize, width); bx++) {
							const pos = (by * width + bx) * 4;
							newData[pos] = r;
							newData[pos + 1] = g;
							newData[pos + 2] = b;
							newData[pos + 3] = a;
						}
					}
				}
			}
			
			return new ImageData(newData, bitmap.width, bitmap.height);
		},
		blockSize,
	);
}