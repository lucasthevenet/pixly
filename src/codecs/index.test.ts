import { describe, it, expect, expectTypeOf } from "vitest";
import {
  auto,
  jpeg,
  png,
  webpDecoder,
  avif,
  jxl,
  qoi,
  webp,
  jpegEncoder,
  pngEncoder,
  avifEncoder,
  jxlEncoder,
  qoiEncoder,
  getFormatFromMagicBytes,
} from "./helpers";
import type { Decoder, Encoder, MimeType } from "./types";

describe("Helper Functions", () => {
  describe("Magic Byte Detection", () => {
    it("should detect PNG format", () => {
      const pngMagic = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(getFormatFromMagicBytes(pngMagic)).toBe("image/png");
    });

    it("should detect JPEG format", () => {
      const jpegMagic = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
      expect(getFormatFromMagicBytes(jpegMagic)).toBe("image/jpeg");
    });

    it("should detect WebP format", () => {
      const webpMagic = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
      expect(getFormatFromMagicBytes(webpMagic)).toBe("image/webp");
    });

    it("should return undefined for unknown format", () => {
      const unknownMagic = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      expect(getFormatFromMagicBytes(unknownMagic)).toBeUndefined();
    });
  });

  describe("Decoder Functions", () => {
    it("should create auto decoder function", () => {
      const decoder = auto();
      expectTypeOf(decoder).toEqualTypeOf<Decoder>();
      expect(typeof decoder).toBe("function");
    });

    it("should create JPEG decoder function", () => {
      const decoder = jpeg();
      expectTypeOf(decoder).toEqualTypeOf<Decoder>();
      expect(typeof decoder).toBe("function");
    });

    it("should create PNG decoder function", () => {
      const decoder = png();
      expectTypeOf(decoder).toEqualTypeOf<Decoder>();
      expect(typeof decoder).toBe("function");
    });

    it("should create WebP decoder function", () => {
      const decoder = webpDecoder();
      expectTypeOf(decoder).toEqualTypeOf<Decoder>();
      expect(typeof decoder).toBe("function");
    });

    it("should create AVIF decoder function", () => {
      const decoder = avif();
      expectTypeOf(decoder).toEqualTypeOf<Decoder>();
      expect(typeof decoder).toBe("function");
    });

    it("should create JXL decoder function", () => {
      const decoder = jxl();
      expectTypeOf(decoder).toEqualTypeOf<Decoder>();
      expect(typeof decoder).toBe("function");
    });

    it("should create QOI decoder function", () => {
      const decoder = qoi();
      expectTypeOf(decoder).toEqualTypeOf<Decoder>();
      expect(typeof decoder).toBe("function");
    });
  });

  describe("Encoder Functions", () => {
    it("should create WebP encoder with defaults", () => {
      const encoder = webp();
      expectTypeOf(encoder).toEqualTypeOf<Encoder>();
      expect(typeof encoder).toBe("function");
    });

    it("should create WebP encoder with custom quality", () => {
      const encoder = webp(90);
      expectTypeOf(encoder).toEqualTypeOf<Encoder>();
      expect(typeof encoder).toBe("function");
    });

    it("should create WebP encoder with custom quality and compression", () => {
      const encoder = webp(90, 8);
      expectTypeOf(encoder).toEqualTypeOf<Encoder>();
      expect(typeof encoder).toBe("function");
    });

    it("should create JPEG encoder with defaults", () => {
      const encoder = jpegEncoder();
      expectTypeOf(encoder).toEqualTypeOf<Encoder>();
      expect(typeof encoder).toBe("function");
    });

    it("should create JPEG encoder with custom quality", () => {
      const encoder = jpegEncoder(95);
      expectTypeOf(encoder).toEqualTypeOf<Encoder>();
      expect(typeof encoder).toBe("function");
    });

    it("should create PNG encoder with defaults", () => {
      const encoder = pngEncoder();
      expectTypeOf(encoder).toEqualTypeOf<Encoder>();
      expect(typeof encoder).toBe("function");
    });

    it("should create PNG encoder with custom compression", () => {
      const encoder = pngEncoder(6);
      expectTypeOf(encoder).toEqualTypeOf<Encoder>();
      expect(typeof encoder).toBe("function");
    });

    it("should create AVIF encoder with defaults", () => {
      const encoder = avifEncoder();
      expectTypeOf(encoder).toEqualTypeOf<Encoder>();
      expect(typeof encoder).toBe("function");
    });

    it("should create AVIF encoder with custom quality", () => {
      const encoder = avifEncoder(70);
      expectTypeOf(encoder).toEqualTypeOf<Encoder>();
      expect(typeof encoder).toBe("function");
    });

    it("should create JXL encoder with defaults", () => {
      const encoder = jxlEncoder();
      expectTypeOf(encoder).toEqualTypeOf<Encoder>();
      expect(typeof encoder).toBe("function");
    });

    it("should create JXL encoder with custom quality", () => {
      const encoder = jxlEncoder(85);
      expectTypeOf(encoder).toEqualTypeOf<Encoder>();
      expect(typeof encoder).toBe("function");
    });

    it("should create QOI encoder", () => {
      const encoder = qoiEncoder();
      expectTypeOf(encoder).toEqualTypeOf<Encoder>();
      expect(typeof encoder).toBe("function");
    });
  });

  describe("Type Safety", () => {
    it("should maintain proper types for all decoder helpers", () => {
      expectTypeOf(auto()).toEqualTypeOf<Decoder>();
      expectTypeOf(jpeg()).toEqualTypeOf<Decoder>();
      expectTypeOf(png()).toEqualTypeOf<Decoder>();
      expectTypeOf(webpDecoder()).toEqualTypeOf<Decoder>();
      expectTypeOf(avif()).toEqualTypeOf<Decoder>();
      expectTypeOf(jxl()).toEqualTypeOf<Decoder>();
      expectTypeOf(qoi()).toEqualTypeOf<Decoder>();
    });

    it("should maintain proper types for all encoder helpers", () => {
      expectTypeOf(webp()).toEqualTypeOf<Encoder>();
      expectTypeOf(webp(80)).toEqualTypeOf<Encoder>();
      expectTypeOf(webp(80, 9)).toEqualTypeOf<Encoder>();
      expectTypeOf(jpegEncoder()).toEqualTypeOf<Encoder>();
      expectTypeOf(jpegEncoder(90)).toEqualTypeOf<Encoder>();
      expectTypeOf(pngEncoder()).toEqualTypeOf<Encoder>();
      expectTypeOf(pngEncoder(8)).toEqualTypeOf<Encoder>();
      expectTypeOf(avifEncoder()).toEqualTypeOf<Encoder>();
      expectTypeOf(avifEncoder(75)).toEqualTypeOf<Encoder>();
      expectTypeOf(jxlEncoder()).toEqualTypeOf<Encoder>();
      expectTypeOf(jxlEncoder(85)).toEqualTypeOf<Encoder>();
      expectTypeOf(qoiEncoder()).toEqualTypeOf<Encoder>();
    });

    it("should accept proper function signatures", () => {
      const decoder = auto();
      expectTypeOf(decoder).parameter(0).toEqualTypeOf<ArrayBuffer>();
      expectTypeOf(decoder).returns.toEqualTypeOf<Promise<ImageData>>();

      const encoder = webp();
      expectTypeOf(encoder).parameter(0).toEqualTypeOf<ImageData>();
      expectTypeOf(encoder).returns.toEqualTypeOf<Promise<ArrayBuffer>>();
    });
  });
});