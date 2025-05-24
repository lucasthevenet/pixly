import type { ImageData } from "../types";
import type { OperationFunction } from "../types";
import { createOperation, validateOperationParams } from "./custom";

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
			const factor =
				(259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

			for (let i = 0; i < newData.length; i += 4) {
				newData[i] = Math.min(
					255,
					Math.max(0, factor * (newData[i] - 128) + 128),
				);
				newData[i + 1] = Math.min(
					255,
					Math.max(0, factor * (newData[i + 1] - 128) + 128),
				);
				newData[i + 2] = Math.min(
					255,
					Math.max(0, factor * (newData[i + 2] - 128) + 128),
				);
			}

			return new ImageData(newData, bitmap.width, bitmap.height);
		},
		amount,
	);
}