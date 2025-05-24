import type { ImageData } from "../types";
import type { OperationFunction } from "../types";
import { createOperation, validateOperationParams } from "./custom";

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
					let r = 0,
						g = 0,
						b = 0,
						a = 0,
						count = 0;

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