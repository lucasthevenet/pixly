import type { ImageData } from "../types";
import type { OperationFunction } from "../types";
import { createOperation, validateOperationParams } from "./custom";

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
				newData[i + 1] = Math.min(
					255,
					Math.max(0, newData[i + 1] + brightness),
				);
				newData[i + 2] = Math.min(
					255,
					Math.max(0, newData[i + 2] + brightness),
				);
			}

			return new ImageData(newData, bitmap.width, bitmap.height);
		},
		amount,
	);
}