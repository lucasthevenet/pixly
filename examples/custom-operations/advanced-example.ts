import {
	type OperationFunction,
	type OperationHandler,
	applyOperation,
	composeOperations,
	createConditionalOperation,
	createImageProcessor,
	createOperation,
	createSafeOperation,
	pipe,
	validateOperationParams,
} from "pixly";

// Advanced Example 1: Multi-stage convolution filter
interface ConvolutionOptions {
	kernel: number[];
	kernelSize: number;
	divisor?: number;
	offset?: number;
}

const convolution = (options: ConvolutionOptions): OperationFunction => {
	validateOperationParams(
		options,
		(opts) =>
			opts.kernel.length === opts.kernelSize * opts.kernelSize &&
			opts.kernelSize % 2 === 1 &&
			opts.kernelSize >= 3,
		"Kernel must be square with odd dimensions >= 3",
	);

	return createOperation(async (bitmap, params: ConvolutionOptions) => {
		const { width, height, data } = bitmap;
		const newData = new Uint8ClampedArray(data);
		const { kernel, kernelSize, divisor = 1, offset = 0 } = params;
		const halfKernel = Math.floor(kernelSize / 2);

		for (let y = halfKernel; y < height - halfKernel; y++) {
			for (let x = halfKernel; x < width - halfKernel; x++) {
				for (let c = 0; c < 3; c++) {
					// RGB channels only
					let sum = 0;

					for (let ky = 0; ky < kernelSize; ky++) {
						for (let kx = 0; kx < kernelSize; kx++) {
							const pixelY = y + ky - halfKernel;
							const pixelX = x + kx - halfKernel;
							const pixelIndex = (pixelY * width + pixelX) * 4 + c;
							const kernelIndex = ky * kernelSize + kx;

							sum += data[pixelIndex] * kernel[kernelIndex];
						}
					}

					const resultIndex = (y * width + x) * 4 + c;
					newData[resultIndex] = Math.min(
						255,
						Math.max(0, sum / divisor + offset),
					);
				}
			}
		}

		return new ImageData(newData, width, height);
	}, options);
};

// Advanced Example 2: Edge detection using Sobel operator
const sobelEdgeDetection = (threshold = 100): OperationFunction =>
	createOperation(async (bitmap, threshold: number) => {
		const { width, height, data } = bitmap;
		const newData = new Uint8ClampedArray(data.length);

		// Sobel X kernel
		const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
		// Sobel Y kernel
		const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

		for (let y = 1; y < height - 1; y++) {
			for (let x = 1; x < width - 1; x++) {
				let gx = 0,
					gy = 0;

				// Apply both kernels
				for (let ky = 0; ky < 3; ky++) {
					for (let kx = 0; kx < 3; kx++) {
						const pixelIndex = ((y + ky - 1) * width + (x + kx - 1)) * 4;
						const kernelIndex = ky * 3 + kx;

						// Use luminance for edge detection
						const luminance =
							data[pixelIndex] * 0.299 +
							data[pixelIndex + 1] * 0.587 +
							data[pixelIndex + 2] * 0.114;

						gx += luminance * sobelX[kernelIndex];
						gy += luminance * sobelY[kernelIndex];
					}
				}

				const magnitude = Math.sqrt(gx * gx + gy * gy);
				const edge = magnitude > threshold ? 255 : 0;

				const resultIndex = (y * width + x) * 4;
				newData[resultIndex] = edge; // Red
				newData[resultIndex + 1] = edge; // Green
				newData[resultIndex + 2] = edge; // Blue
				newData[resultIndex + 3] = 255; // Alpha
			}
		}

		return new ImageData(newData, width, height);
	}, threshold);

// Advanced Example 3: Histogram equalization
const histogramEqualization = (): OperationFunction =>
	createOperation(async (bitmap) => {
		const { width, height, data } = bitmap;
		const newData = new Uint8ClampedArray(data);

		// Calculate histogram for luminance
		const histogram = new Array(256).fill(0);
		const totalPixels = width * height;

		for (let i = 0; i < data.length; i += 4) {
			const luminance = Math.round(
				data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114,
			);
			histogram[luminance]++;
		}

		// Calculate cumulative distribution function
		const cdf = new Array(256);
		cdf[0] = histogram[0];
		for (let i = 1; i < 256; i++) {
			cdf[i] = cdf[i - 1] + histogram[i];
		}

		// Normalize CDF
		const cdfMin = cdf.find((val) => val > 0) || 0;
		for (let i = 0; i < 256; i++) {
			cdf[i] = Math.round(((cdf[i] - cdfMin) / (totalPixels - cdfMin)) * 255);
		}

		// Apply equalization
		for (let i = 0; i < newData.length; i += 4) {
			const r = newData[i];
			const g = newData[i + 1];
			const b = newData[i + 2];

			const oldLuminance = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
			const newLuminance = cdf[oldLuminance];
			const ratio = newLuminance / Math.max(1, oldLuminance);

			newData[i] = Math.min(255, r * ratio);
			newData[i + 1] = Math.min(255, g * ratio);
			newData[i + 2] = Math.min(255, b * ratio);
		}

		return new ImageData(newData, width, height);
	});

// Advanced Example 4: Adaptive contrast enhancement
const adaptiveContrastEnhancement = (windowSize = 64): OperationFunction =>
	createOperation(async (bitmap, windowSize: number) => {
		const { width, height, data } = bitmap;
		const newData = new Uint8ClampedArray(data);
		const halfWindow = Math.floor(windowSize / 2);

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				// Define local window
				const startY = Math.max(0, y - halfWindow);
				const endY = Math.min(height - 1, y + halfWindow);
				const startX = Math.max(0, x - halfWindow);
				const endX = Math.min(width - 1, x + halfWindow);

				// Calculate local statistics
				let sum = 0,
					sumSquares = 0,
					count = 0;

				for (let wy = startY; wy <= endY; wy++) {
					for (let wx = startX; wx <= endX; wx++) {
						const pixelIndex = (wy * width + wx) * 4;
						const luminance =
							data[pixelIndex] * 0.299 +
							data[pixelIndex + 1] * 0.587 +
							data[pixelIndex + 2] * 0.114;
						sum += luminance;
						sumSquares += luminance * luminance;
						count++;
					}
				}

				const mean = sum / count;
				const variance = sumSquares / count - mean * mean;
				const stdDev = Math.sqrt(variance);

				// Adaptive enhancement
				const currentIndex = (y * width + x) * 4;
				const currentLuminance =
					data[currentIndex] * 0.299 +
					data[currentIndex + 1] * 0.587 +
					data[currentIndex + 2] * 0.114;

				const alpha = stdDev > 0 ? Math.min(2, 64 / stdDev) : 1;
				const enhanced = mean + alpha * (currentLuminance - mean);
				const ratio = enhanced / Math.max(1, currentLuminance);

				newData[currentIndex] = Math.min(
					255,
					Math.max(0, data[currentIndex] * ratio),
				);
				newData[currentIndex + 1] = Math.min(
					255,
					Math.max(0, data[currentIndex + 1] * ratio),
				);
				newData[currentIndex + 2] = Math.min(
					255,
					Math.max(0, data[currentIndex + 2] * ratio),
				);
			}
		}

		return new ImageData(newData, width, height);
	}, windowSize);

// Advanced Example 5: Performance-optimized operation with Web Workers simulation
const performanceOptimizedOperation = (intensity: number): OperationFunction =>
	createOperation(async (bitmap, intensity: number) => {
		const { width, height, data } = bitmap;
		const newData = new Uint8ClampedArray(data);

		// Simulate chunked processing for large images
		const chunkSize = 64 * 64 * 4; // Process 64x64 pixel chunks
		const chunks: Promise<void>[] = [];

		for (let start = 0; start < data.length; start += chunkSize) {
			const chunkPromise = new Promise<void>((resolve) => {
				// Simulate async processing (in real scenario, this could be a Web Worker)
				setTimeout(() => {
					const end = Math.min(start + chunkSize, data.length);

					for (let i = start; i < end; i += 4) {
						// Complex operation simulation
						const r = data[i];
						const g = data[i + 1];
						const b = data[i + 2];

						// Apply some complex transformation
						const luminance = r * 0.299 + g * 0.587 + b * 0.114;
						const factor =
							1 + (intensity / 100) * Math.sin((luminance / 255) * Math.PI);

						newData[i] = Math.min(255, Math.max(0, r * factor));
						newData[i + 1] = Math.min(255, Math.max(0, g * factor));
						newData[i + 2] = Math.min(255, Math.max(0, b * factor));
						newData[i + 3] = data[i + 3];
					}

					resolve();
				}, 0);
			});

			chunks.push(chunkPromise);
		}

		await Promise.all(chunks);
		return new ImageData(newData, width, height);
	}, intensity);

// Advanced Example 6: Machine learning-inspired operation
interface MLStyleOptions {
	style: "enhance" | "artistic" | "vintage" | "dramatic";
	strength: number;
}

const mlStyleTransfer = (options: MLStyleOptions): OperationFunction =>
	createOperation(async (bitmap, params: MLStyleOptions) => {
		const { width, height, data } = bitmap;
		const newData = new Uint8ClampedArray(data);

		// Different "learned" transformations based on style
		const transformations = {
			enhance: (r: number, g: number, b: number) => [
				Math.min(255, r * 1.2 + 10),
				Math.min(255, g * 1.15 + 5),
				Math.min(255, b * 1.1),
			],
			artistic: (r: number, g: number, b: number) => [
				Math.min(255, Math.pow(r / 255, 0.8) * 255),
				Math.min(255, Math.pow(g / 255, 0.9) * 255),
				Math.min(255, Math.pow(b / 255, 1.1) * 255),
			],
			vintage: (r: number, g: number, b: number) => [
				Math.min(255, r * 0.9 + g * 0.1),
				Math.min(255, r * 0.2 + g * 0.8 + b * 0.1),
				Math.min(255, r * 0.1 + b * 0.7),
			],
			dramatic: (r: number, g: number, b: number) => {
				const contrast = 1.5;
				const midpoint = 128;
				return [
					Math.min(255, Math.max(0, contrast * (r - midpoint) + midpoint)),
					Math.min(255, Math.max(0, contrast * (g - midpoint) + midpoint)),
					Math.min(255, Math.max(0, contrast * (b - midpoint) + midpoint)),
				];
			},
		};

		const transform = transformations[params.style];

		for (let i = 0; i < data.length; i += 4) {
			const [newR, newG, newB] = transform(data[i], data[i + 1], data[i + 2]);

			// Blend with original based on strength
			newData[i] = data[i] + params.strength * (newR - data[i]);
			newData[i + 1] = data[i + 1] + params.strength * (newG - data[i + 1]);
			newData[i + 2] = data[i + 2] + params.strength * (newB - data[i + 2]);
			newData[i + 3] = data[i + 3];
		}

		return new ImageData(newData, width, height);
	}, options);

// Advanced Example 7: Real-time preview operation
const createPreviewOperation = (
	baseOperation: OperationFunction,
	previewScale = 0.25,
): OperationFunction =>
	createConditionalOperation(
		(bitmap) => bitmap.width * bitmap.height > 1000000, // Large image
		createOperation(async (bitmap) => {
			// Create downscaled version for preview
			const previewWidth = Math.round(bitmap.width * previewScale);
			const previewHeight = Math.round(bitmap.height * previewScale);

			// Simple nearest-neighbor downscaling
			const previewData = new Uint8ClampedArray(
				previewWidth * previewHeight * 4,
			);

			for (let y = 0; y < previewHeight; y++) {
				for (let x = 0; x < previewWidth; x++) {
					const srcX = Math.round(x / previewScale);
					const srcY = Math.round(y / previewScale);
					const srcIndex = (srcY * bitmap.width + srcX) * 4;
					const dstIndex = (y * previewWidth + x) * 4;

					previewData[dstIndex] = bitmap.data[srcIndex];
					previewData[dstIndex + 1] = bitmap.data[srcIndex + 1];
					previewData[dstIndex + 2] = bitmap.data[srcIndex + 2];
					previewData[dstIndex + 3] = bitmap.data[srcIndex + 3];
				}
			}

			const previewBitmap = new ImageData(
				previewData,
				previewWidth,
				previewHeight,
			);

			// Apply operation to preview
			const processedPreview = await baseOperation(previewBitmap);

			// Upscale back (in real app, you'd show this as preview and apply full operation separately)
			const fullData = new Uint8ClampedArray(bitmap.data.length);

			for (let y = 0; y < bitmap.height; y++) {
				for (let x = 0; x < bitmap.width; x++) {
					const previewX = Math.round(x * previewScale);
					const previewY = Math.round(y * previewScale);
					const previewIndex =
						(Math.min(previewY, previewHeight - 1) * previewWidth +
							Math.min(previewX, previewWidth - 1)) *
						4;
					const fullIndex = (y * bitmap.width + x) * 4;

					fullData[fullIndex] = processedPreview.data[previewIndex];
					fullData[fullIndex + 1] = processedPreview.data[previewIndex + 1];
					fullData[fullIndex + 2] = processedPreview.data[previewIndex + 2];
					fullData[fullIndex + 3] = bitmap.data[fullIndex + 3];
				}
			}

			return new ImageData(fullData, bitmap.width, bitmap.height);
		}),
		baseOperation, // Apply normally for small images
	);

// Export all advanced operations
export {
	convolution,
	sobelEdgeDetection,
	histogramEqualization,
	adaptiveContrastEnhancement,
	performanceOptimizedOperation,
	mlStyleTransfer,
	createPreviewOperation,
	type ConvolutionOptions,
	type MLStyleOptions,
};

// Example usage combining multiple advanced techniques
export const createAdvancedPipeline = () =>
	composeOperations(
		createSafeOperation(histogramEqualization()),
		adaptiveContrastEnhancement(32),
		mlStyleTransfer({ style: "enhance", strength: 0.7 }),
		createPreviewOperation(sobelEdgeDetection(50), 0.5),
	);
