import { ImageData } from "../types";
import type { OperationFunction } from "../types";
import { createOperation } from "./custom";

/**
 * Grayscale conversion with different methods
 */
export interface GrayscaleOptions {
	method: "average" | "luminance" | "desaturation" | "red" | "green" | "blue";
}

export function grayscale(
	options: GrayscaleOptions = { method: "luminance" },
): OperationFunction {
	return createOperation(
		async (bitmap: ImageData, params: GrayscaleOptions): Promise<ImageData> => {
			const newData = new Uint8ClampedArray(bitmap.data);

			for (let i = 0; i < newData.length; i += 4) {
				const r = newData[i]!;
				const g = newData[i + 1]!;
				const b = newData[i + 2]!;

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
