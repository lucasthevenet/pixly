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
		const decoder = px.jpeg();
		expectTypeOf(decoder).toEqualTypeOf<Decoder>();
		expect(typeof decoder).toBe("function");
	});

	it("should create PNG decoder function", () => {
		const decoder = px.png();
		expectTypeOf(decoder).toEqualTypeOf<Decoder>();
		expect(typeof decoder).toBe("function");
	});

	it("should create WebP decoder function", () => {
		const decoder = px.webpDecoder();
		expectTypeOf(decoder).toEqualTypeOf<Decoder>();
		expect(typeof decoder).toBe("function");
	});

	it("should create AVIF decoder function", () => {
		const decoder = px.avif();
		expectTypeOf(decoder).toEqualTypeOf<Decoder>();
		expect(typeof decoder).toBe("function");
	});

	it("should create JXL decoder function", () => {
		const decoder = px.jxl();
		expectTypeOf(decoder).toEqualTypeOf<Decoder>();
		expect(typeof decoder).toBe("function");
	});

	it("should create QOI decoder function", () => {
		const decoder = px.qoi();
		expectTypeOf(decoder).toEqualTypeOf<Decoder>();
		expect(typeof decoder).toBe("function");
	});
});

describe("Encoder Functions", () => {
	it("should create WebP encoder with defaults", () => {
		const encoder = px.webp();
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create WebP encoder with custom quality", () => {
		const encoder = px.webp({ quality: 90 });
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create WebP encoder with custom quality and compression", () => {
		const encoder = px.webp({ quality: 90, alpha_compression: 9 });
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create JPEG encoder with defaults", () => {
		const encoder = px.jpegEncoder();
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create JPEG encoder with custom quality", () => {
		const encoder = px.jpegEncoder({ quality: 95 });
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create PNG encoder with defaults", () => {
		const encoder = px.pngEncoder();
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create PNG encoder with custom compression", () => {
		const encoder = px.pngEncoder();
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create AVIF encoder with defaults", () => {
		const encoder = px.avifEncoder();
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create AVIF encoder with custom quality", () => {
		const encoder = px.avifEncoder({ quality: 70 });
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create JXL encoder with defaults", () => {
		const encoder = px.jxlEncoder();
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create JXL encoder with custom quality", () => {
		const encoder = px.jxlEncoder({ quality: 85 });
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});

	it("should create QOI encoder", () => {
		const encoder = px.qoiEncoder();
		expectTypeOf(encoder).toEqualTypeOf<Encoder>();
		expect(typeof encoder).toBe("function");
	});
});

describe("Type Safety", () => {
	it("should maintain proper types for all decoder helpers", () => {
		expectTypeOf(px.auto()).toEqualTypeOf<Decoder>();
		expectTypeOf(px.jpeg()).toEqualTypeOf<Decoder>();
		expectTypeOf(px.png()).toEqualTypeOf<Decoder>();
		expectTypeOf(px.webpDecoder()).toEqualTypeOf<Decoder>();
		expectTypeOf(px.avif()).toEqualTypeOf<Decoder>();
		expectTypeOf(px.jxl()).toEqualTypeOf<Decoder>();
		expectTypeOf(px.qoi()).toEqualTypeOf<Decoder>();
	});

	it("should maintain proper types for all encoder helpers", () => {
		expectTypeOf(px.webp()).toEqualTypeOf<Encoder>();
		expectTypeOf(px.webp({ quality: 80 })).toEqualTypeOf<Encoder>();
		expectTypeOf(px.jpegEncoder()).toEqualTypeOf<Encoder>();
		expectTypeOf(px.jpegEncoder({ quality: 90 })).toEqualTypeOf<Encoder>();
		expectTypeOf(px.pngEncoder()).toEqualTypeOf<Encoder>();
		expectTypeOf(px.pngEncoder()).toEqualTypeOf<Encoder>();
		expectTypeOf(px.avifEncoder()).toEqualTypeOf<Encoder>();
		expectTypeOf(px.avifEncoder({ quality: 75 })).toEqualTypeOf<Encoder>();
		expectTypeOf(px.jxlEncoder()).toEqualTypeOf<Encoder>();
		expectTypeOf(px.jxlEncoder({ quality: 85 })).toEqualTypeOf<Encoder>();
		expectTypeOf(px.qoiEncoder()).toEqualTypeOf<Encoder>();
	});
});
