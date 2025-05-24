import { ImageData } from "../types";
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
export function isOperationFunction(
	value: unknown,
): value is OperationFunction {
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
			console.warn("Operation failed, returning original bitmap:", error);
			return bitmap;
		}
	};
}

/**
 * Compose multiple operations into a single operation
 */
export function composeOperations(
	...operations: OperationFunction[]
): OperationFunction {
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

// Utility functions only - individual operations have been moved to separate files
