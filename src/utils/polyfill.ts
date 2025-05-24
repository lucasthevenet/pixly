import type { ColorSpace } from "../types";
import { isRunningInCloudFlareWorkers, isRunningInNode } from "./environment";

if (isRunningInCloudFlareWorkers || isRunningInNode) {
	if (!globalThis.ImageData) {
		// Simple Polyfill for ImageData Object
		globalThis.ImageData = class ImageData {
			readonly data: Uint8ClampedArray;
			readonly width: number;
			readonly height: number;
			readonly colorSpace: ColorSpace;

			constructor(sw: number, sh: number, settings?: ImageDataSettings);
			constructor(
				data: Uint8ClampedArray,
				sw: number,
				sh?: number,
				settings?: ImageDataSettings,
			);
			constructor(
				dataOrWidth: Uint8ClampedArray | number,
				widthOrHeight: number,
				heightOrSettings?: number | ImageDataSettings,
			) {
				if (dataOrWidth instanceof Uint8ClampedArray) {
					// Constructor with data
					this.data = dataOrWidth;
					this.width = widthOrHeight;

					if (typeof heightOrSettings === "number") {
						// data, width, height
						this.height = heightOrSettings;
						this.colorSpace = "srgb";
					} else {
						// data, width, settings (height calculated from data length)
						this.height = dataOrWidth.length / (4 * widthOrHeight);
						this.colorSpace =
							(heightOrSettings as ImageDataSettings)?.colorSpace || "srgb";
					}
				} else {
					// Constructor with width/height only
					this.width = dataOrWidth;
					this.height = widthOrHeight;
					this.data = new Uint8ClampedArray(this.width * this.height * 4);
					this.colorSpace =
						(heightOrSettings as ImageDataSettings)?.colorSpace || "srgb";
				}
			}
		};
	}
}
