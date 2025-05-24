import type { ImageData } from "../types";
import type { OperationFunction } from "../types";
import { createOperation, validateOperationParams } from "./custom";

/**
 * Sepia tone effect
 */
export function sepia(intensity = 1): OperationFunction {
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

				const newR = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
				const newG = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
				const newB = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);

				newData[i] = r + intensity * (newR - r);
				newData[i + 1] = g + intensity * (newG - g);
				newData[i + 2] = b + intensity * (newB - b);
			}

			return new ImageData(newData, bitmap.width, bitmap.height);
		},
		intensity,
	);
}