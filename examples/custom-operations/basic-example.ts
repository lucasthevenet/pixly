import {
	type GrayscaleOptions,
	type OperationFunction,
	applyOperation,
	brightness,
	composeOperations,
	contrast,
	createConditionalOperation,
	createImageProcessor,
	createOperation,
	createSafeOperation,
	grayscale,
	pipe,
	sepia,
	toBlob,
} from "pixly";

// Example 1: Simple custom operation without parameters
const invertColors: OperationFunction = async (bitmap) => {
	const newData = new Uint8ClampedArray(bitmap.data);

	for (let i = 0; i < newData.length; i += 4) {
		newData[i] = 255 - newData[i]; // Invert red
		newData[i + 1] = 255 - newData[i + 1]; // Invert green
		newData[i + 2] = 255 - newData[i + 2]; // Invert blue
		// Alpha channel remains unchanged
	}

	return new ImageData(newData, bitmap.width, bitmap.height);
};

// Example 2: Custom operation with parameters
const customSaturation = (factor: number): OperationFunction =>
	createOperation(async (bitmap, saturationFactor: number) => {
		const newData = new Uint8ClampedArray(bitmap.data);

		for (let i = 0; i < newData.length; i += 4) {
			const r = newData[i];
			const g = newData[i + 1];
			const b = newData[i + 2];

			// Convert to HSL, adjust saturation, convert back
			const max = Math.max(r, g, b);
			const min = Math.min(r, g, b);
			const avg = (max + min) / 2;

			// Simple saturation adjustment
			newData[i] = Math.min(
				255,
				Math.max(0, avg + (r - avg) * saturationFactor),
			);
			newData[i + 1] = Math.min(
				255,
				Math.max(0, avg + (g - avg) * saturationFactor),
			);
			newData[i + 2] = Math.min(
				255,
				Math.max(0, avg + (b - avg) * saturationFactor),
			);
		}

		return new ImageData(newData, bitmap.width, bitmap.height);
	}, factor);

// Example 3: Complex custom filter
const vintagePhotoEffect = (): OperationFunction =>
	composeOperations(
		// Step 1: Slight desaturation
		customSaturation(0.8),

		// Step 2: Warm color cast
		createOperation(async (bitmap) => {
			const newData = new Uint8ClampedArray(bitmap.data);

			for (let i = 0; i < newData.length; i += 4) {
				newData[i] = Math.min(255, newData[i] * 1.1); // Enhance red
				newData[i + 1] = Math.min(255, newData[i + 1] * 1.05); // Slight green
				newData[i + 2] = Math.min(255, newData[i + 2] * 0.9); // Reduce blue
			}

			return new ImageData(newData, bitmap.width, bitmap.height);
		}),

		// Step 3: Add vignette effect
		createOperation(async (bitmap) => {
			const { width, height, data } = bitmap;
			const newData = new Uint8ClampedArray(data);
			const centerX = width / 2;
			const centerY = height / 2;
			const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

			for (let y = 0; y < height; y++) {
				for (let x = 0; x < width; x++) {
					const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
					const vignette = 1 - Math.pow(distance / maxDistance, 2) * 0.3;

					const pixelIndex = (y * width + x) * 4;
					newData[pixelIndex] *= vignette; // Red
					newData[pixelIndex + 1] *= vignette; // Green
					newData[pixelIndex + 2] *= vignette; // Blue
				}
			}

			return new ImageData(newData, width, height);
		}),
	);

// Example 4: Conditional operation based on image characteristics
const smartEnhancement = createConditionalOperation(
	(bitmap) => {
		// Calculate average brightness
		let totalBrightness = 0;
		for (let i = 0; i < bitmap.data.length; i += 4) {
			const r = bitmap.data[i];
			const g = bitmap.data[i + 1];
			const b = bitmap.data[i + 2];
			totalBrightness += (r + g + b) / 3;
		}
		const avgBrightness = totalBrightness / (bitmap.data.length / 4);

		return avgBrightness < 100; // Dark image
	},
	// Enhance dark images
	composeOperations(brightness(30), contrast(0.2)),
	// Slight enhancement for bright images
	contrast(0.1),
);

// Example 5: Safe operation with error recovery
const safeColorAdjustment = createSafeOperation(
	createOperation(
		async (bitmap, params: { red: number; green: number; blue: number }) => {
			if (params.red < 0 || params.green < 0 || params.blue < 0) {
				throw new Error("Color values cannot be negative");
			}

			const newData = new Uint8ClampedArray(bitmap.data);

			for (let i = 0; i < newData.length; i += 4) {
				newData[i] = Math.min(255, newData[i] * params.red);
				newData[i + 1] = Math.min(255, newData[i + 1] * params.green);
				newData[i + 2] = Math.min(255, newData[i + 2] * params.blue);
			}

			return new ImageData(newData, bitmap.width, bitmap.height);
		},
		{ red: 1.2, green: 1.1, blue: 0.9 },
	),
	// Fallback to simple brightness adjustment
	async (bitmap) => brightness(10)(bitmap),
);

// Main example function demonstrating usage
export async function runCustomOperationsExample() {
	try {
		// Load an image (you would provide an actual image file)
		const processor = await createImageProcessor("./sample-image.jpg");

		console.log(
			"Original image size:",
			processor.bitmap?.width,
			"x",
			processor.bitmap?.height,
		);

		// Example 1: Apply simple invert operation
		console.log("Applying invert operation...");
		const inverted = await applyOperation(processor, invertColors);

		// Example 2: Apply custom saturation
		console.log("Applying custom saturation...");
		const saturated = await applyOperation(processor, customSaturation(1.5));

		// Example 3: Apply vintage effect
		console.log("Applying vintage effect...");
		const vintage = await applyOperation(processor, vintagePhotoEffect());

		// Example 4: Apply smart enhancement
		console.log("Applying smart enhancement...");
		const enhanced = await applyOperation(processor, smartEnhancement);

		// Example 5: Apply safe color adjustment
		console.log("Applying safe color adjustment...");
		const colorAdjusted = await applyOperation(processor, safeColorAdjustment);

		// Example 6: Complex pipeline using pipe utility
		console.log("Applying complex pipeline...");
		const complexPipeline = pipe(
			brightness(10),
			customSaturation(1.2),
			contrast(0.1),
			smartEnhancement,
		);
		const pipelineResult = await complexPipeline(processor);

		// Example 7: Using built-in operations with custom ones
		console.log("Combining built-in and custom operations...");
		const combined = await pipe(
			grayscale({ method: "luminance" } as GrayscaleOptions),
			sepia(0.6),
			customSaturation(0.8),
			vintagePhotoEffect(),
		)(processor);

		// Convert results to blobs for saving/display
		const invertedBlob = await toBlob(inverted, { format: "image/jpeg" });
		const vintageBlob = await toBlob(vintage, { format: "image/jpeg" });
		const combinedBlob = await toBlob(combined, { format: "image/jpeg" });

		console.log("Processing complete!");
		console.log("Inverted image blob size:", invertedBlob.size, "bytes");
		console.log("Vintage image blob size:", vintageBlob.size, "bytes");
		console.log("Combined effect blob size:", combinedBlob.size, "bytes");

		return {
			inverted: invertedBlob,
			vintage: vintageBlob,
			combined: combinedBlob,
		};
	} catch (error) {
		console.error("Error processing image:", error);
		throw error;
	}
}

// Export the custom operations for reuse
export {
	invertColors,
	customSaturation,
	vintagePhotoEffect,
	smartEnhancement,
	safeColorAdjustment,
};
