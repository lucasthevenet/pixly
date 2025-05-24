import { describe, expect, it } from "vitest";
import {
	applyOperation,
	blur,
	createOperation,
	crop,
	flip,
	resize,
	rotate,
} from "../src/index";
import type { OperationFunction } from "../src/index";

// Create a simple test image (2x2 pixels, RGBA)
const createTestImageData = () => {
	const data = new Uint8ClampedArray([
		255,
		0,
		0,
		255, // Red pixel
		0,
		255,
		0,
		255, // Green pixel
		0,
		0,
		255,
		255, // Blue pixel
		255,
		255,
		255,
		255, // White pixel
	]);
	return new ImageData(data, 2, 2);
};

describe("Function-based Operations", () => {
	it("should create operation functions that return functions", () => {
		const resizeOp = resize({
			width: 100,
			height: 100,
			fit: "contain",
			position: "center",
			background: [0, 0, 0, 0],
		});
		const rotateOp = rotate(90, [0, 0, 0, 0]);
		const flipOp = flip("horizontal");
		const cropOp = crop({
			x: 0,
			y: 0,
			width: 50,
			height: 50,
			background: [0, 0, 0, 0],
		});
		const blurOp = blur(5);

		expect(typeof resizeOp).toBe("function");
		expect(typeof rotateOp).toBe("function");
		expect(typeof flipOp).toBe("function");
		expect(typeof cropOp).toBe("function");
		expect(typeof blurOp).toBe("function");
	});

	it("should apply function-based operations to processor", async () => {
		const testImageData = createTestImageData();
		const processor = {
			buffer: new Uint8Array(),
			bitmap: testImageData,
			config: {},
		};

		const resizeOp = resize({
			width: 4,
			height: 4,
			fit: "contain",
			position: "center",
			background: [0, 0, 0, 0],
		});
		const result = await applyOperation(processor, resizeOp);

		expect(result).not.toBe(processor);
		expect(result.bitmap).toBeDefined();
		expect(result.bitmap?.width).toBeGreaterThan(0);
		expect(result.bitmap?.height).toBeGreaterThan(0);
	});

	it("should create custom operations using createOperation helper", async () => {
		const testImageData = createTestImageData();

		// Create a custom grayscale operation
		const grayscale: OperationFunction = createOperation(
			async (bitmap, params: { method: string }) => {
				const newData = new Uint8ClampedArray(bitmap.data.length);

				for (let i = 0; i < bitmap.data.length; i += 4) {
					const r = bitmap.data[i];
					const g = bitmap.data[i + 1];
					const b = bitmap.data[i + 2];
					const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

					newData[i] = gray; // Red
					newData[i + 1] = gray; // Green
					newData[i + 2] = gray; // Blue
					newData[i + 3] = bitmap.data[i + 3]; // Alpha
				}

				return new ImageData(newData, bitmap.width, bitmap.height);
			},
			{ method: "luminance" },
		);

		const processor = {
			buffer: new Uint8Array(),
			bitmap: testImageData,
			config: {},
		};

		const result = await applyOperation(processor, grayscale);

		expect(result.bitmap).toBeDefined();
		expect(result.bitmap?.width).toBe(2);
		expect(result.bitmap?.height).toBe(2);

		// Check that the first pixel is grayscale (R=G=B)
		const firstPixelR = result.bitmap?.data[0];
		const firstPixelG = result.bitmap?.data[1];
		const firstPixelB = result.bitmap?.data[2];
		expect(firstPixelR).toBe(firstPixelG);
		expect(firstPixelG).toBe(firstPixelB);
	});

	it("should handle operation errors gracefully", async () => {
		const testImageData = createTestImageData();
		const processor = {
			buffer: new Uint8Array(),
			bitmap: testImageData,
			config: {},
		};

		// Create an operation that throws an error
		const errorOperation: OperationFunction = async () => {
			throw new Error("Test operation error");
		};

		await expect(applyOperation(processor, errorOperation)).rejects.toThrow(
			"Operation failed: Test operation error",
		);
	});

	it("should work with processors without bitmaps", async () => {
		const processor = {
			buffer: new Uint8Array(),
			bitmap: null,
			config: {},
		};

		const resizeOp = resize({
			width: 100,
			height: 100,
			fit: "contain",
			position: "center",
			background: [0, 0, 0, 0],
		});
		const result = await applyOperation(processor, resizeOp);

		expect(result).toEqual(processor);
		expect(result.bitmap).toBe(null);
	});

	it("should verify operation function signature", () => {
		const resizeOp = resize({
			width: 100,
			height: 100,
			fit: "contain",
			position: "center",
			background: [0, 0, 0, 0],
		});

		// Should be a function that accepts ImageData and returns Promise<ImageData>
		expect(resizeOp).toBeInstanceOf(Function);
		expect(resizeOp.length).toBe(1); // Should accept one parameter (bitmap)
	});
});
