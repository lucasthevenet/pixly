import type { ImageData } from "../types";
import type { OperationFunction } from "../types";
import { createOperation } from "./custom";

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
					newData[i + 1] = Math.min(
						255,
						Math.max(0, newData[i + 1] * params.green),
					);
				}
				if (params.blue !== undefined) {
					newData[i + 2] = Math.min(
						255,
						Math.max(0, newData[i + 2] * params.blue),
					);
				}
				if (params.alpha !== undefined) {
					newData[i + 3] = Math.min(
						255,
						Math.max(0, newData[i + 3] * params.alpha),
					);
				}
			}

			return new ImageData(newData, bitmap.width, bitmap.height);
		},
		options,
	);
}