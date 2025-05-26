import type { OperationFunction } from "../types";
import { createOperation, validateOperationParams } from "./custom";

/**
 * Simple sharpening filter (unsharp mask)
 */
export function sharpen(intensity = 1): OperationFunction {
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
				0,
				-intensity,
				0,
				-intensity,
				1 + 4 * intensity,
				-intensity,
				0,
				-intensity,
				0,
			];

			for (let y = 1; y < height - 1; y++) {
				for (let x = 1; x < width - 1; x++) {
					for (let c = 0; c < 3; c++) {
						// RGB channels only
						let sum = 0;
						for (let ky = -1; ky <= 1; ky++) {
							for (let kx = -1; kx <= 1; kx++) {
								const pos = ((y + ky) * width + (x + kx)) * 4 + c;
								const kernelPos = (ky + 1) * 3 + (kx + 1);
								sum += bitmap.data[pos]! * kernel[kernelPos]!;
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
