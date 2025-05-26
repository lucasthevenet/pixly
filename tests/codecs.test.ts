import { describe, expect, expectTypeOf, it } from "vitest";
import { px } from "../src";

import type { Decoder, Encoder } from "../src/types";

describe("Decoder Functions", () => {
	it("should create auto decoder function", () => {
		const decoder = px.auto();
		expectTypeOf(decoder).toEqualTypeOf<Decoder>();
		expect(typeof decoder).toBe("function");
	});

	it("should create JPEG decoder function", () => {
		const decoder = px.jpeg.decode();
		expectTypeOf(decoder).toEqualTypeOf<Decoder>();
		expect(typeof decoder).toBe("function");
	});

	it("should create PNG decoder function", () => {
		const decoder = px.png.decode();
		expectTypeOf(decoder).toEqualTypeOf<Decoder>();
		expect(typeof decoder).toBe("function");
	});

	it("should create WebP decoder function", () => {
		const decoder = px.webp.decode();
		expectTypeOf(decoder).toEqualTypeOf<Decoder>();
		expect(typeof decoder).toBe("function");
	});

	it("should create AVIF decoder function", () => {
		const decoder = px.avif.decode();
		expectTypeOf(decoder).toEqualTypeOf<Decoder>();
		expect(typeof decoder).toBe("function");
	});

	it("should create JXL decoder function", () => {
		const decoder = px.jxl.decode();
		expectTypeOf(decoder).toEqualTypeOf<Decoder>();
		expect(typeof decoder).toBe("function");
	});

	it("should create QOI decoder function", () => {
		const decoder = px.qoi.decode();
		expectTypeOf(decoder).toEqualTypeOf<Decoder>();
		expect(typeof decoder).toBe("function");
	});
});

describe("Encoder Functions", () => {
	it("should create WebP encoder with defaults", () => {
		const encoder = px.webp.encode();
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create WebP encoder with custom quality", () => {
		const encoder = px.webp.encode({ quality: 90 });
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create WebP encoder with custom quality and compression", () => {
		const encoder = px.webp.encode({ quality: 90, alpha_compression: 9 });
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create JPEG encoder with defaults", () => {
		const encoder = px.jpeg.encode();
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create JPEG encoder with custom quality", () => {
		const encoder = px.jpeg.encode({ quality: 95 });
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create PNG encoder with defaults", () => {
		const encoder = px.png.encode();
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create PNG encoder with custom compression", () => {
		const encoder = px.png.encode();
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create AVIF encoder with defaults", () => {
		const encoder = px.avif.encode();
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create AVIF encoder with custom quality", () => {
		const encoder = px.avif.encode({ quality: 70 });
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create JXL encoder with defaults", () => {
		const encoder = px.jxl.encode();
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create JXL encoder with custom quality", () => {
		const encoder = px.jxl.encode({ quality: 85 });
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create QOI encoder", () => {
		const encoder = px.qoi.encode();
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});
});

describe("Type Safety", () => {
	it("should maintain proper types for all decoder helpers", () => {
		expectTypeOf(px.auto()).toEqualTypeOf<Decoder>();
		expectTypeOf(px.jpeg.decode()).toEqualTypeOf<Decoder>();
		expectTypeOf(px.png.decode()).toEqualTypeOf<Decoder>();
		expectTypeOf(px.webp.decode()).toEqualTypeOf<Decoder>();
		expectTypeOf(px.avif.decode()).toEqualTypeOf<Decoder>();
		expectTypeOf(px.jxl.decode()).toEqualTypeOf<Decoder>();
		expectTypeOf(px.qoi.decode()).toEqualTypeOf<Decoder>();
	});

	it("should maintain proper types for all encoder helpers", () => {
		expectTypeOf(px.webp.encode()).toEqualTypeOf<Encoder>();
		expectTypeOf(px.webp.encode({ quality: 80 })).toEqualTypeOf<Encoder>();
		expectTypeOf(px.jpeg.encode()).toEqualTypeOf<Encoder>();
		expectTypeOf(px.jpeg.encode({ quality: 90 })).toEqualTypeOf<Encoder>();
		expectTypeOf(px.png.encode()).toEqualTypeOf<Encoder>();
		expectTypeOf(px.avif.encode()).toEqualTypeOf<Encoder>();
		expectTypeOf(px.avif.encode({ quality: 75 })).toEqualTypeOf<Encoder>();
		expectTypeOf(px.jxl.encode()).toEqualTypeOf<Encoder>();
		expectTypeOf(px.jxl.encode({ quality: 85 })).toEqualTypeOf<Encoder>();
		expectTypeOf(px.qoi.encode()).toEqualTypeOf<Encoder>();
	});
});
