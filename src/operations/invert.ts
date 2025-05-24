import type { ImageData } from "../types";
import type { OperationFunction } from "../types";
import { createOperation } from "./custom";

/**
 * Invert colors
 */
export function invert(): OperationFunction {
	return createOperation(async (bitmap: ImageData): Promise<ImageData> => {
		const newData = new Uint8ClampedArray(bitmap.data);

		for (let i = 0; i < newData.length; i += 4) {
			newData[i] = 255 - newData[i]; // Red
			newData[i + 1] = 255 - newData[i + 1]; // Green
			newData[i + 2] = 255 - newData[i + 2]; // Blue
		}

		return new ImageData(newData, bitmap.width, bitmap.height);
	});
}