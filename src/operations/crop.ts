import type { Color, OperationFunction } from "../types";
import { createOperation } from "./custom";

export interface CropOptions {
	/** The x position of the upper left pixel. */
	x: number;
	/** The y position of the upper left pixel. */
	y: number;
	/** The number of pixels wide to crop the image. */
	width: number;
	/** The number of pixels high to crop the image. */
	height: number;
	background: Color;
}

const ternaryPercent = (num: number, full: number) =>
	num < 1 ? Math.round(num * full) : num;

export function crop(options: CropOptions): OperationFunction {
	return createOperation(
		async (src: ImageData, cropOptions: CropOptions): Promise<ImageData> => {
			const startX = ternaryPercent(cropOptions.x, src.width);
			const startY = ternaryPercent(cropOptions.y, src.height);
			const cropWidth = ternaryPercent(cropOptions.width, src.width);
			const cropHeight = ternaryPercent(cropOptions.height, src.height);

			const dstBuffer = new Uint8ClampedArray(cropWidth * cropHeight * 4);

			for (let i = 0; i < dstBuffer.length; i += 4) {
				dstBuffer.set(cropOptions.background, i);
			}

			const deltaX = cropWidth - startX;
			const deltaY = cropHeight - startY;

			for (let y = 0; y < deltaY; y += 1) {
				const srcIdx = ((startY + y) * src.width + startX) << 2;
				const srcEndIdx = srcIdx + (deltaX << 2);
				const pixelRow = src.data.subarray(srcIdx, srcEndIdx);

				const dstIdx = (y * cropWidth) << 2;
				dstBuffer.set(pixelRow, dstIdx);
			}

			return {
				data: dstBuffer,
				width: cropWidth,
				height: cropHeight,
				colorSpace: "srgb",
			};
		},
		options,
	);
}
