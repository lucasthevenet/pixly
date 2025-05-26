import resize, { initResize } from "@jsquash/resize";
import type { OperationFunction, ResizeOptions } from "../types";
import {
	isRunningInCloudFlareWorkers,
	isRunningInNode,
} from "../utils/environment";
import { getFrameDimensions } from "../utils/sizing";
import { createOperation } from "./custom";

const RESIZE_WASM =
	"node_modules/@jsquash/resize/lib/resize/pkg/squoosh_resize_bg.wasm";

let isWasmInitialized = false;

async function initializeResize(): Promise<void> {
	if (isWasmInitialized) return;

	if (isRunningInCloudFlareWorkers) {
		await initResize(RESIZE_WASM);
		isWasmInitialized = true;
		return;
	}

	if (isRunningInNode) {
		const fs = await import("node:fs");
		const pngWasmBuffer = fs.readFileSync(RESIZE_WASM);
		const pngWasmModule = await WebAssembly.compile(pngWasmBuffer);
		await initResize(pngWasmModule);
		isWasmInitialized = true;
		return;
	}
}

const resizeImageWasm = async (
	src: ImageData,
	opts: ResizeOptions,
): Promise<ImageData> => {
	if (!opts.width && !opts.height) {
		throw new Error("At least one dimension must be provided!");
	}

	await initializeResize();

	const { frameWidth, frameHeight } = getFrameDimensions(
		src.width,
		src.height,
		opts.width,
		opts.height,
		opts.fit,
	);

	const dstBuffer = new Uint8ClampedArray(src.data.length);

	for (let i = 0; i < dstBuffer.length; i += 4) {
		if (dstBuffer[i + 3] === 0x0) {
			dstBuffer.set(opts.background, i);
		} else {
			dstBuffer.set(src.data.slice(i, i + 4), i);
		}
	}

	const resizedImageData = await resize(
		{
			width: src.width,
			height: src.height,
			data: new Uint8ClampedArray(src.data),
			colorSpace: "srgb",
		},
		{
			width: frameWidth,
			height: frameHeight,
			fitMethod: "stretch",
		},
	);

	return {
		data: resizedImageData.data,
		width: resizedImageData.width,
		height: resizedImageData.height,
		colorSpace: "srgb",
	};
};

export function resizeWasm(options: ResizeOptions): OperationFunction {
	return createOperation(resizeImageWasm, options);
}
