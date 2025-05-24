import { describe, expect, it } from "vitest";
import {
	createOperation,
	createSafeOperation,
	isOperationFunction,
	validateOperationParams,
	composeOperations,
	createConditionalOperation,
	adjustChannels,
	brightness,
	contrast,
	grayscale,
	sepia,
	invert,
	tint,
	sharpen,
	pixelate,
	applyOperation,
} from "../src/index";
import type { OperationFunction, TintOptions, GrayscaleOptions, ChannelOptions } from "../src/index";

// Create a simple test image (2x2 pixels, RGBA)
const createTestImageData = () => {
	const data = new Uint8ClampedArray([
		255, 0, 0, 255,     // Red pixel
		0, 255, 0, 255,     // Green pixel
		0, 0, 255, 255,     // Blue pixel
		255, 255, 255, 255  // White pixel
	]);
	return new ImageData(data, 2, 2);
};

const createTestProcessor = (imageData = createTestImageData()) => ({
	buffer: new Uint8Array(),
	bitmap: imageData,
	config: {}
});

describe("Custom Operation Utilities", () => {
	describe("createOperation", () => {
		it("should create operation without parameters", async () => {
			const simpleOp = createOperation(async (bitmap) => {
				const newData = new Uint8ClampedArray(bitmap.data);
				return new ImageData(newData, bitmap.width, bitmap.height);
			});

			const result = await simpleOp(createTestImageData());
			expect(result).toBeInstanceOf(ImageData);
		});

		it("should create operation with parameters", async () => {
			const paramOp = createOperation(
				async (bitmap, multiplier: number) => {
					const newData = new Uint8ClampedArray(bitmap.data.length);
					for (let i = 0; i < bitmap.data.length; i += 4) {
						newData[i] = Math.min(255, bitmap.data[i] * multiplier);
						newData[i + 1] = Math.min(255, bitmap.data[i + 1] * multiplier);
						newData[i + 2] = Math.min(255, bitmap.data[i + 2] * multiplier);
						newData[i + 3] = bitmap.data[i + 3];
					}
					return new ImageData(newData, bitmap.width, bitmap.height);
				},
				2
			);

			const result = await paramOp(createTestImageData());
			expect(result).toBeInstanceOf(ImageData);
		});
	});

	describe("isOperationFunction", () => {
		it("should identify valid operation functions", () => {
			const validOp = brightness(50);
			expect(isOperationFunction(validOp)).toBe(true);
		});

		it("should reject invalid functions", () => {
			const invalidOp = (a: number, b: number) => a + b;
			expect(isOperationFunction(invalidOp)).toBe(false);
			expect(isOperationFunction("not a function")).toBe(false);
			expect(isOperationFunction(null)).toBe(false);
		});
	});

	describe("validateOperationParams", () => {
		it("should pass valid parameters", () => {
			expect(() => {
				validateOperationParams(50, (val) => val >= 0 && val <= 100, "Invalid range");
			}).not.toThrow();
		});

		it("should throw for invalid parameters", () => {
			expect(() => {
				validateOperationParams(150, (val) => val >= 0 && val <= 100, "Invalid range");
			}).toThrow("Invalid operation parameters: Invalid range");
		});
	});

	describe("createSafeOperation", () => {
		it("should handle successful operations", async () => {
			const safeOp = createSafeOperation(async (bitmap) => {
				return new ImageData(new Uint8ClampedArray(bitmap.data), bitmap.width, bitmap.height);
			});

			const result = await safeOp(createTestImageData());
			expect(result).toBeInstanceOf(ImageData);
		});

		it("should handle failed operations with fallback", async () => {
			const fallback = async (bitmap: ImageData) => bitmap;
			const safeOp = createSafeOperation(
				async () => { throw new Error("Test error"); },
				fallback
			);

			const original = createTestImageData();
			const result = await safeOp(original);
			expect(result).toBe(original);
		});

		it("should return original bitmap when no fallback provided", async () => {
			const safeOp = createSafeOperation(async () => {
				throw new Error("Test error");
			});

			const original = createTestImageData();
			const result = await safeOp(original);
			expect(result).toBe(original);
		});
	});

	describe("composeOperations", () => {
		it("should compose multiple operations", async () => {
			const op1 = brightness(10);
			const op2 = contrast(0.1);
			const composed = composeOperations(op1, op2);

			const result = await composed(createTestImageData());
			expect(result).toBeInstanceOf(ImageData);
		});

		it("should apply operations in sequence", async () => {
			const redChannel = adjustChannels({ red: 2, green: 1, blue: 1 });
			const makeGrayscale = grayscale({ method: "luminance" });
			const composed = composeOperations(redChannel, makeGrayscale);

			const result = await composed(createTestImageData());
			expect(result).toBeInstanceOf(ImageData);
			
			// After grayscale, RGB values should be equal
			expect(result.data[0]).toBe(result.data[1]);
			expect(result.data[1]).toBe(result.data[2]);
		});
	});

	describe("createConditionalOperation", () => {
		it("should apply operation when condition is true", async () => {
			const condition = (bitmap: ImageData) => bitmap.width > 1;
			const operation = brightness(50);
			const conditional = createConditionalOperation(condition, operation);

			const result = await conditional(createTestImageData());
			expect(result).toBeInstanceOf(ImageData);
		});

		it("should skip operation when condition is false", async () => {
			const condition = (bitmap: ImageData) => bitmap.width > 10;
			const operation = brightness(50);
			const conditional = createConditionalOperation(condition, operation);

			const original = createTestImageData();
			const result = await conditional(original);
			expect(result).toBe(original);
		});

		it("should apply else operation when condition is false", async () => {
			const condition = (bitmap: ImageData) => bitmap.width > 10;
			const operation = brightness(50);
			const elseOp = brightness(-50);
			const conditional = createConditionalOperation(condition, operation, elseOp);

			const result = await conditional(createTestImageData());
			expect(result).toBeInstanceOf(ImageData);
		});
	});
});

describe("Built-in Custom Operations", () => {
	describe("adjustChannels", () => {
		it("should adjust individual color channels", async () => {
			const options: ChannelOptions = { red: 2, green: 0.5, blue: 1, alpha: 1 };
			const operation = adjustChannels(options);
			
			const processor = createTestProcessor();
			const result = await applyOperation(processor, operation);
			
			expect(result.bitmap).toBeInstanceOf(ImageData);
		});
	});

	describe("brightness", () => {
		it("should increase brightness", async () => {
			const operation = brightness(50);
			const processor = createTestProcessor();
			const result = await applyOperation(processor, operation);
			
			expect(result.bitmap).toBeInstanceOf(ImageData);
			// Brightness should increase pixel values (check red channel of green pixel, which starts at 0)
			expect(result.bitmap!.data[4]).toBeGreaterThan(processor.bitmap!.data[4]);
		});

		it("should decrease brightness", async () => {
			const operation = brightness(-50);
			const processor = createTestProcessor();
			const result = await applyOperation(processor, operation);
			
			expect(result.bitmap).toBeInstanceOf(ImageData);
			// Brightness should decrease pixel values
			expect(result.bitmap!.data[0]).toBeLessThan(processor.bitmap!.data[0]);
		});

		it("should validate brightness range", () => {
			expect(() => brightness(300)).toThrow();
			expect(() => brightness(-300)).toThrow();
		});
	});

	describe("contrast", () => {
		it("should adjust contrast", async () => {
			const operation = contrast(0.5);
			const processor = createTestProcessor();
			const result = await applyOperation(processor, operation);
			
			expect(result.bitmap).toBeInstanceOf(ImageData);
		});

		it("should validate contrast range", () => {
			expect(() => contrast(2)).toThrow();
			expect(() => contrast(-2)).toThrow();
		});
	});

	describe("grayscale", () => {
		it("should convert to grayscale using luminance method", async () => {
			const options: GrayscaleOptions = { method: "luminance" };
			const operation = grayscale(options);
			const processor = createTestProcessor();
			const result = await applyOperation(processor, operation);
			
			expect(result.bitmap).toBeInstanceOf(ImageData);
			// After grayscale, RGB values should be equal for each pixel
			for (let i = 0; i < result.bitmap!.data.length; i += 4) {
				expect(result.bitmap!.data[i]).toBe(result.bitmap!.data[i + 1]);
				expect(result.bitmap!.data[i + 1]).toBe(result.bitmap!.data[i + 2]);
			}
		});

		it("should support different grayscale methods", async () => {
			const methods: GrayscaleOptions["method"][] = ["average", "luminance", "desaturation", "red", "green", "blue"];
			
			for (const method of methods) {
				const operation = grayscale({ method });
				const processor = createTestProcessor();
				const result = await applyOperation(processor, operation);
				expect(result.bitmap).toBeInstanceOf(ImageData);
			}
		});
	});

	describe("sepia", () => {
		it("should apply sepia effect", async () => {
			const operation = sepia(0.8);
			const processor = createTestProcessor();
			const result = await applyOperation(processor, operation);
			
			expect(result.bitmap).toBeInstanceOf(ImageData);
		});

		it("should validate sepia intensity range", () => {
			expect(() => sepia(2)).toThrow();
			expect(() => sepia(-0.5)).toThrow();
		});
	});

	describe("invert", () => {
		it("should invert colors", async () => {
			const operation = invert();
			const processor = createTestProcessor();
			const result = await applyOperation(processor, operation);
			
			expect(result.bitmap).toBeInstanceOf(ImageData);
			// Red pixel (255,0,0) should become cyan (0,255,255)
			expect(result.bitmap!.data[0]).toBe(0);   // 255 - 255 = 0
			expect(result.bitmap!.data[1]).toBe(255); // 255 - 0 = 255
			expect(result.bitmap!.data[2]).toBe(255); // 255 - 0 = 255
		});
	});

	describe("tint", () => {
		it("should apply color tint", async () => {
			const options: TintOptions = { red: 255, green: 0, blue: 0, opacity: 0.5 };
			const operation = tint(options);
			const processor = createTestProcessor();
			const result = await applyOperation(processor, operation);
			
			expect(result.bitmap).toBeInstanceOf(ImageData);
		});

		it("should validate tint parameters", () => {
			expect(() => tint({ red: 300, green: 0, blue: 0, opacity: 0.5 })).toThrow();
			expect(() => tint({ red: 255, green: 0, blue: 0, opacity: 2 })).toThrow();
		});
	});

	describe("sharpen", () => {
		it("should apply sharpening effect", async () => {
			const operation = sharpen(1);
			const processor = createTestProcessor();
			const result = await applyOperation(processor, operation);
			
			expect(result.bitmap).toBeInstanceOf(ImageData);
		});

		it("should validate sharpen intensity range", () => {
			expect(() => sharpen(3)).toThrow();
			expect(() => sharpen(-1)).toThrow();
		});
	});

	describe("pixelate", () => {
		it("should apply pixelation effect", async () => {
			const operation = pixelate(2);
			const processor = createTestProcessor();
			const result = await applyOperation(processor, operation);
			
			expect(result.bitmap).toBeInstanceOf(ImageData);
		});

		it("should validate block size range", () => {
			expect(() => pixelate(0)).toThrow();
			expect(() => pixelate(200)).toThrow();
		});
	});
});

describe("Advanced Usage Patterns", () => {
	it("should work with complex operation pipelines", async () => {
		const pipeline = composeOperations(
			brightness(20),
			contrast(0.1),
			grayscale({ method: "luminance" }),
			sepia(0.3)
		);

		const processor = createTestProcessor();
		const result = await applyOperation(processor, pipeline);
		
		expect(result.bitmap).toBeInstanceOf(ImageData);
	});

	it("should work with conditional operations", async () => {
		const brightenLargeImages = createConditionalOperation(
			(bitmap) => bitmap.width * bitmap.height > 4,
			brightness(50),
			brightness(-10)
		);

		const smallImageProcessor = createTestProcessor(); // 2x2 = 4 pixels
		const result = await applyOperation(smallImageProcessor, brightenLargeImages);
		
		expect(result.bitmap).toBeInstanceOf(ImageData);
	});

	it("should handle safe operations with error recovery", async () => {
		const riskyOperation = createSafeOperation(
			async () => { throw new Error("Simulated failure"); },
			async (bitmap) => brightness(10)(bitmap) // Fallback to simple brightness
		);

		const processor = createTestProcessor();
		const result = await applyOperation(processor, riskyOperation);
		
		expect(result.bitmap).toBeInstanceOf(ImageData);
	});
});