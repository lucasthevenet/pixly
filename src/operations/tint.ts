import { ImageData } from "../types";
import type { OperationFunction } from "../types";
import { createOperation, validateOperationParams } from "./custom";

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
			opts.red >= 0 &&
			opts.red <= 255 &&
			opts.green >= 0 &&
			opts.green <= 255 &&
			opts.blue >= 0 &&
			opts.blue <= 255 &&
			opts.opacity >= 0 &&
			opts.opacity <= 1,
		"Tint values must be valid (RGB: 0-255, opacity: 0-1)",
	);

	return createOperation(
		async (bitmap: ImageData, params: TintOptions): Promise<ImageData> => {
			const newData = new Uint8ClampedArray(bitmap.data);

			for (let i = 0; i < newData.length; i += 4) {
				newData[i] = newData[i]! + params.opacity * (params.red - newData[i]!);
				newData[i + 1] =
					newData[i + 1]! + params.opacity * (params.green - newData[i + 1]!);
				newData[i + 2] =
					newData[i + 2]! + params.opacity * (params.blue - newData[i + 2]!);
			}

			return new ImageData(newData, bitmap.width, bitmap.height);
		},
		options,
	);
}
