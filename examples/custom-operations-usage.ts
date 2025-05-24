import {
	applyOperation,
	applyOperations,
	blur,
	compose,
	createImageProcessor,
	createOperation,
	crop,
	flip,
	pipe,
	resize,
	rotate,
	toDataURL,
} from "../src/index";
import type { Color, OperationFunction } from "../src/index";

// Example: Basic usage with built-in operations
async function basicUsage() {
	// Load an image
	const processor = await createImageProcessor("path/to/image.jpg");

	// Apply individual operations
	const resized = await applyOperation(
		processor,
		resize({ width: 800, height: 600, fit: "cover", position: "center", background: [0, 0, 0, 0] })
	);

	const rotated = await applyOperation(
		resized,
		rotate(90, [255, 255, 255, 255])
	);

	// Apply multiple operations at once
	const processed = await applyOperations(processor, [
		resize({ width: 400, height: 400, fit: "contain", position: "center", background: [0, 0, 0, 0] }),
		blur(2),
		flip("horizontal"),
	]);

	return processed;
}

// Example: Using pipe for functional composition
async function functionalComposition() {
	const processor = await createImageProcessor("path/to/image.jpg");

	const pipeline = pipe(
		resize({ width: 1200, height: 800, fit: "cover", position: "center", background: [0, 0, 0, 0] }),
		rotate(45, [0, 0, 0, 0]),
		blur(1),
		crop({ x: 100, y: 100, width: 600, height: 400, background: [0, 0, 0, 0] })
	);

	const result = await pipeline(processor);
	return result;
}

// Example: Creating custom operations
const grayscale: OperationFunction = createOperation(
	async (bitmap, params: { method: "average" | "luminance" | "desaturation" }) => {
		const newData = new Uint8ClampedArray(bitmap.data.length);

		for (let i = 0; i < bitmap.data.length; i += 4) {
			const r = bitmap.data[i];
			const g = bitmap.data[i + 1];
			const b = bitmap.data[i + 2];

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
			}

			newData[i] = gray;     // Red
			newData[i + 1] = gray; // Green
			newData[i + 2] = gray; // Blue
			newData[i + 3] = bitmap.data[i + 3]; // Alpha (unchanged)
		}

		return new ImageData(newData, bitmap.width, bitmap.height, bitmap.colorSpace);
	},
	{ method: "luminance" }
);

const sepia: OperationFunction = createOperation(
	async (bitmap, params: { intensity: number }) => {
		const newData = new Uint8ClampedArray(bitmap.data.length);
		const intensity = Math.max(0, Math.min(1, params.intensity));

		for (let i = 0; i < bitmap.data.length; i += 4) {
			const r = bitmap.data[i];
			const g = bitmap.data[i + 1];
			const b = bitmap.data[i + 2];

			// Sepia formula
			const tr = 0.393 * r + 0.769 * g + 0.189 * b;
			const tg = 0.349 * r + 0.686 * g + 0.168 * b;
			const tb = 0.272 * r + 0.534 * g + 0.131 * b;

			// Blend with original based on intensity
			newData[i] = Math.min(255, tr * intensity + r * (1 - intensity));
			newData[i + 1] = Math.min(255, tg * intensity + g * (1 - intensity));
			newData[i + 2] = Math.min(255, tb * intensity + b * (1 - intensity));
			newData[i + 3] = bitmap.data[i + 3]; // Alpha unchanged
		}

		return new ImageData(newData, bitmap.width, bitmap.height, bitmap.colorSpace);
	},
	{ intensity: 0.8 }
);

const brighten: OperationFunction = createOperation(
	async (bitmap, params: { amount: number }) => {
		const newData = new Uint8ClampedArray(bitmap.data.length);

		for (let i = 0; i < bitmap.data.length; i += 4) {
			newData[i] = Math.min(255, Math.max(0, bitmap.data[i] + params.amount));     // Red
			newData[i + 1] = Math.min(255, Math.max(0, bitmap.data[i + 1] + params.amount)); // Green
			newData[i + 2] = Math.min(255, Math.max(0, bitmap.data[i + 2] + params.amount)); // Blue
			newData[i + 3] = bitmap.data[i + 3]; // Alpha unchanged
		}

		return new ImageData(newData, bitmap.width, bitmap.height, bitmap.colorSpace);
	},
	{ amount: 50 }
);

// Example: Using custom operations
async function customOperationsExample() {
	const processor = await createImageProcessor("path/to/image.jpg");

	// Use custom operations in a pipeline
	const vintagePipeline = pipe(
		resize({ width: 800, height: 600, fit: "cover", position: "center", background: [0, 0, 0, 0] }),
		sepia,
		brighten,
		blur(0.5)
	);

	const vintageResult = await vintagePipeline(processor);

	// Mix built-in and custom operations
	const result = await applyOperations(processor, [
		resize({ width: 600, height: 600, fit: "contain", position: "center", background: [255, 255, 255, 255] }),
		grayscale,
		rotate(10, [255, 255, 255, 255]),
		crop({ x: 50, y: 50, width: 500, height: 500, background: [255, 255, 255, 255] })
	]);

	return result;
}

// Example: Creating reusable operation factories
function createColorAdjustment(adjustments: { brightness?: number; contrast?: number; saturation?: number }) {
	return createOperation(
		async (bitmap, params: typeof adjustments) => {
			const newData = new Uint8ClampedArray(bitmap.data.length);
			const brightness = params.brightness || 0;
			const contrast = params.contrast || 1;
			const saturation = params.saturation || 1;

			for (let i = 0; i < bitmap.data.length; i += 4) {
				let r = bitmap.data[i];
				let g = bitmap.data[i + 1];
				let b = bitmap.data[i + 2];

				// Apply brightness
				r += brightness;
				g += brightness;
				b += brightness;

				// Apply contrast
				r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
				g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
				b = ((b / 255 - 0.5) * contrast + 0.5) * 255;

				// Simple saturation adjustment (convert to HSL would be better)
				const gray = 0.299 * r + 0.587 * g + 0.114 * b;
				r = gray + saturation * (r - gray);
				g = gray + saturation * (g - gray);
				b = gray + saturation * (b - gray);

				// Clamp values
				newData[i] = Math.min(255, Math.max(0, r));
				newData[i + 1] = Math.min(255, Math.max(0, g));
				newData[i + 2] = Math.min(255, Math.max(0, b));
				newData[i + 3] = bitmap.data[i + 3]; // Alpha unchanged
			}

			return new ImageData(newData, bitmap.width, bitmap.height, bitmap.colorSpace);
		},
		adjustments
	);
}

// Example: Complex processing workflow
async function complexWorkflow() {
	const processor = await createImageProcessor("path/to/image.jpg");

	// Create custom color adjustment
	const enhance = createColorAdjustment({
		brightness: 20,
		contrast: 1.2,
		saturation: 1.1
	});

	// Create thumbnail pipeline
	const thumbnailPipeline = pipe(
		resize({ width: 300, height: 300, fit: "cover", position: "center", background: [255, 255, 255, 255] }),
		enhance,
		blur(0.3)
	);

	// Create high-quality pipeline
	const highQualityPipeline = pipe(
		resize({ width: 1920, height: 1080, fit: "contain", position: "center", background: [0, 0, 0, 0] }),
		enhance,
		rotate(2, [0, 0, 0, 0]) // Slight rotation for dynamic look
	);

	const thumbnail = await thumbnailPipeline(processor);
	const highQuality = await highQualityPipeline(processor);

	// Convert to data URLs for usage
	const thumbnailDataURL = await toDataURL(thumbnail, { format: "image/jpeg", quality: 80 });
	const highQualityDataURL = await toDataURL(highQuality, { format: "image/jpeg", quality: 95 });

	return { thumbnail: thumbnailDataURL, highQuality: highQualityDataURL };
}

// Example: Inline custom operation
async function inlineCustomOperation() {
	const processor = await createImageProcessor("path/to/image.jpg");
