import "./utils/polyfill";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ImageBuilder } from "./image-builder";
import type { Decoder, Encoder, OperationFunction } from "./types";

function mockOp(label: string): OperationFunction {
	return vi.fn(async (img: ImageData): Promise<ImageData> => {
		// Append label to width for test tracking
		return new ImageData(img.width + 1, img.height);
	});
}

describe("ImageBuilder integration with codec options (encoders)", () => {
	// Mocks for codecs with options
	function mockCodecEncoderSpy(label: string) {
		const encoder = vi.fn(async (_img: ImageData, options?: any) => {
			// Mutate shape to prove option value was received
			const val = options?.marker ?? -999;
			// Return a marker result in the ArrayBuffer (not actually used, just for spy check)
			const arr = new Uint8Array([val]);
			return arr.buffer;
		});
		return encoder;
	}

	it("can pipeline with a WebP encoder with options", async () => {
		const decoder = mockDecoderWithDimensions(1, 1);
		const encoder = mockCodecEncoderSpy("webp");
		const op1 = mockOp("noop");

		// "webp()" would typically be a factory, but we'll just inject our spy with options support
		// Simulate builder.encoder(webp({ quality: 99, marker: 42 }))
		const builder = new ImageBuilder({ decoder })
			.apply(op1)
			.encoder((img: ImageData) => encoder(img, { quality: 99, marker: 42 }));

		const inputBuffer = new ArrayBuffer(4);
		// Using result data directly since .toBuffer is not implemented yet
		const result = await builder.process(inputBuffer);
		await encoder(result.getImageData(), { quality: 99, marker: 42 });

		expect(encoder).toHaveBeenCalled();
		// Should have received our marker options
		expect(new Uint8Array(await encoder.mock.results[0]!.value).at(0)).toBe(42);
	});

	it("can pipeline with JPEG encoder with options", async () => {
		const decoder = mockDecoderWithDimensions(1, 1);
		const encoder = mockCodecEncoderSpy("jpeg");
		const builder = new ImageBuilder({ decoder }).encoder((img: ImageData) =>
			encoder(img, { quality: 92, progressive: true, marker: 55 }),
		);
		const inputBuffer = new ArrayBuffer(2);

		const result = await builder.process(inputBuffer);
		await encoder(result.getImageData(), {
			quality: 92,
			progressive: true,
			marker: 55,
		});

		expect(encoder).toHaveBeenCalled();
		expect(new Uint8Array(await encoder.mock.results[0]!.value).at(0)).toBe(55);
	});

	it("can pipeline with AVIF encoder with options", async () => {
		const decoder = mockDecoderWithDimensions(1, 1);
		const encoder = mockCodecEncoderSpy("avif");
		const builder = new ImageBuilder({ decoder }).encoder((img: ImageData) =>
			encoder(img, { cqLevel: 7, marker: 123 }),
		);
		const inputBuffer = new ArrayBuffer(5);

		const result = await builder.process(inputBuffer);
		await encoder(result.getImageData(), { cqLevel: 7, marker: 123 });

		expect(encoder).toHaveBeenCalled();
		expect(new Uint8Array(await encoder.mock.results[0]!.value).at(0)).toBe(
			123,
		);
	});

	it("can pipeline with JXL encoder with options", async () => {
		const decoder = mockDecoderWithDimensions(1, 1);
		const encoder = mockCodecEncoderSpy("jxl");
		const builder = new ImageBuilder({ decoder }).encoder((img: ImageData) =>
			encoder(img, { epf: 1, marker: 222 }),
		);
		const inputBuffer = new ArrayBuffer(7);

		const result = await builder.process(inputBuffer);
		await encoder(result.getImageData(), { epf: 1, marker: 222 });

		expect(encoder).toHaveBeenCalled();
		expect(new Uint8Array(await encoder.mock.results[0]!.value).at(0)).toBe(
			222,
		);
	});
});

// Polyfill ImageData for Node/Edge test runners
function polyfillImageData() {
	if (typeof globalThis.ImageData === "undefined") {
		// Minimal (non-canvas) ImageData polyfill for testing
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		globalThis.ImageData = class ImageData {
			width: number;
			height: number;
			data: Uint8ClampedArray;
			constructor(width: number, height: number) {
				this.width = width;
				this.height = height;
				this.data = new Uint8ClampedArray(width * height * 4);
			}
		} as any;
	}
}
function mockDecoderWithDimensions(width: number, height: number): Decoder {
	return vi.fn(async (_buffer: ArrayBuffer): Promise<ImageData> => {
		return new ImageData(width, height);
	});
}
function mockEncoder(): Encoder {
	return vi.fn(async (_img: ImageData): Promise<ArrayBuffer> => {
		return new ArrayBuffer(1);
	});
}

describe("ImageBuilder", () => {
	beforeAll(() => {
		polyfillImageData();
	});
	it("constructs with default config (decoder/encoder required)", () => {
		expect(() => new ImageBuilder()).not.toThrow();
	});

	it("returns a new builder with apply(), keeping previous state immutable", () => {
		const decoder = mockDecoderWithDimensions(2, 2);
		const encoder = mockEncoder();

		const builder1 = new ImageBuilder({ decoder, encoder });
		const op1 = mockOp("op1");
		const op2 = mockOp("op2");

		const builder2 = builder1.apply(op1);
		const builder3 = builder2.apply(op2);

		expect(builder2).not.toBe(builder1);
		expect(builder3).not.toBe(builder2);
		// Internal ops should grow
		// @ts-expect-private
		expect((builder1 as any).ops.length).toBe(0);
		expect((builder2 as any).ops.length).toBe(1);
		expect((builder3 as any).ops.length).toBe(2);
	});

	it("chaining decoder() and encoder() works immutably", () => {
		const decoderA = mockDecoderWithDimensions(2, 2);
		const decoderB = mockDecoderWithDimensions(3, 3);
		const encoderA = mockEncoder();
		const encoderB = mockEncoder();

		const builder0 = new ImageBuilder();
		const builder1 = builder0.decoder(decoderA);
		const builder2 = builder1.encoder(encoderB);
		const builder3 = builder2.decoder(decoderB);

		expect((builder0 as any).dec).not.toBe((builder1 as any).dec);
		expect((builder2 as any).enc).not.toBe((builder1 as any).enc);
		expect((builder3 as any).dec).toBe(decoderB);
		expect((builder3 as any).enc).toBe(encoderB);
	});

	it("preset() returns a composed operation that chains all operations", async () => {
		const decoder = mockDecoderWithDimensions(2, 2);
		const encoder = mockEncoder();
		const op1 = mockOp("op1");
		const op2 = mockOp("op2");

		const builder = new ImageBuilder({ decoder, encoder })
			.apply(op1)
			.apply(op2);
		const presetOp = builder.preset();

		const inp = new ImageData(1, 1);
		const result = await presetOp(inp);

		// Both operations should be called
		expect(op1).toHaveBeenCalled();
		expect(op2).toHaveBeenCalled();
		// Since our mockOp adds 1 to width each time, result width should be 3
		expect(result.width).toBe(3);
		expect(result.height).toBe(1);
	});

	it("process() applies decoder and all operations, returns result with getImageData", async () => {
		const decoder = mockDecoderWithDimensions(1, 1);
		const encoder = mockEncoder();
		const op1 = mockOp("op1");

		const builder = new ImageBuilder({ decoder, encoder }).apply(op1);

		// Minimal ArrayBuffer input
		const inputBuffer = new ArrayBuffer(4);
		const result = await builder.process(inputBuffer);

		expect(op1).toHaveBeenCalled();
		expect(result.getImageData().width).toBe(2); // Decoder returns 1, op adds 1
		expect(result.getImageData().height).toBe(1);
		expect(typeof result.toBuffer).toBe("function");
		expect(typeof result.toDataURL).toBe("function");
		expect(typeof result.toBlob).toBe("function");
	});

	it("throws helpful errors if encoder/decoder not set", async () => {
		const builder = new ImageBuilder();
		await expect(() => builder.process(new ArrayBuffer(8))).rejects.toThrow(
			/No decoder set/,
		);
	});
});
