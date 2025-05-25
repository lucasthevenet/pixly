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
  customDecoder,
  customEncoder,
} from "./helpers";
import type { DecoderConfig, EncoderConfig } from "./composable-types";

describe("Helper Functions", () => {
  describe("Decoder Helpers", () => {
    it("should create auto decoder config", () => {
      const config = auto();
      expect(config).toEqual({ type: "auto" });
      expectTypeOf(config).toEqualTypeOf<DecoderConfig>();
    });

    it("should create JPEG decoder config", () => {
      const config = jpeg();
      expect(config).toEqual({ type: "image/jpeg" });
      expectTypeOf(config).toEqualTypeOf<DecoderConfig>();
    });

    it("should create PNG decoder config", () => {
      const config = png();
      expect(config).toEqual({ type: "image/png" });
      expectTypeOf(config).toEqualTypeOf<DecoderConfig>();
    });

    it("should create WebP decoder config", () => {
      const config = webpDecoder();
      expect(config).toEqual({ type: "image/webp" });
      expectTypeOf(config).toEqualTypeOf<DecoderConfig>();
    });

    it("should create AVIF decoder config", () => {
      const config = avif();
      expect(config).toEqual({ type: "image/avif" });
      expectTypeOf(config).toEqualTypeOf<DecoderConfig>();
    });

    it("should create JXL decoder config", () => {
      const config = jxl();
      expect(config).toEqual({ type: "image/jxl" });
      expectTypeOf(config).toEqualTypeOf<DecoderConfig>();
    });

    it("should create QOI decoder config", () => {
      const config = qoi();
      expect(config).toEqual({ type: "image/qoi" });
      expectTypeOf(config).toEqualTypeOf<DecoderConfig>();
    });

    it("should create custom decoder config", () => {
      const config = customDecoder("image/jpeg", true);
      expect(config).toEqual({
        type: "image/jpeg",
        preserveMetadata: true,
      });
      expectTypeOf(config).toEqualTypeOf<DecoderConfig>();
    });

    it("should create custom decoder config without metadata preservation", () => {
      const config = customDecoder("image/png");
      expect(config).toEqual({
        type: "image/png",
        preserveMetadata: undefined,
      });
    });
  });

  describe("Encoder Helpers", () => {
    it("should create WebP encoder config with defaults", () => {
      const config = webp();
      expect(config).toEqual({
        format: "image/webp",
        quality: 80,
        compressionLevel: 9,
      });
      expectTypeOf(config).toEqualTypeOf<EncoderConfig>();
    });

    it("should create WebP encoder config with custom options", () => {
      const config = webp({ quality: 90, compressionLevel: 8 });
      expect(config).toEqual({
        format: "image/webp",
        quality: 90,
        compressionLevel: 8,
      });
    });

    it("should create JPEG encoder config with defaults", () => {
      const config = jpegEncoder();
      expect(config).toEqual({
        format: "image/jpeg",
        quality: 80,
      });
      expectTypeOf(config).toEqualTypeOf<EncoderConfig>();
    });

    it("should create JPEG encoder config with custom quality", () => {
      const config = jpegEncoder({ quality: 95 });
      expect(config).toEqual({
        format: "image/jpeg",
        quality: 95,
      });
    });

    it("should create PNG encoder config with defaults", () => {
      const config = pngEncoder();
      expect(config).toEqual({
        format: "image/png",
        compressionLevel: 9,
      });
      expectTypeOf(config).toEqualTypeOf<EncoderConfig>();
    });

    it("should create PNG encoder config with custom compression", () => {
      const config = pngEncoder({ compressionLevel: 6 });
      expect(config).toEqual({
        format: "image/png",
        compressionLevel: 6,
      });
    });

    it("should create AVIF encoder config with defaults", () => {
      const config = avifEncoder();
      expect(config).toEqual({
        format: "image/avif",
        quality: 80,
      });
      expectTypeOf(config).toEqualTypeOf<EncoderConfig>();
    });

    it("should create AVIF encoder config with custom quality", () => {
      const config = avifEncoder({ quality: 70 });
      expect(config).toEqual({
        format: "image/avif",
        quality: 70,
      });
    });

    it("should create JXL encoder config with defaults", () => {
      const config = jxlEncoder();
      expect(config).toEqual({
        format: "image/jxl",
        quality: 80,
      });
      expectTypeOf(config).toEqualTypeOf<EncoderConfig>();
    });

    it("should create JXL encoder config with custom quality", () => {
      const config = jxlEncoder({ quality: 85 });
      expect(config).toEqual({
        format: "image/jxl",
        quality: 85,
      });
    });

    it("should create QOI encoder config", () => {
      const config = qoiEncoder();
      expect(config).toEqual({
        format: "image/qoi",
      });
      expectTypeOf(config).toEqualTypeOf<EncoderConfig>();
    });

    it("should create custom encoder config", () => {
      const customConfig: EncoderConfig = {
        format: "image/webp",
        quality: 95,
        compressionLevel: 6,
        loop: 5,
        delay: 200,
      };
      const config = customEncoder(customConfig);
      expect(config).toEqual(customConfig);
      expect(config).not.toBe(customConfig); // Should be a copy
      expectTypeOf(config).toEqualTypeOf<EncoderConfig>();
    });
  });

  describe("Type Safety", () => {
    it("should maintain proper types for all helpers", () => {
      // Decoder helpers should return DecoderConfig
      expectTypeOf(auto()).toEqualTypeOf<DecoderConfig>();
      expectTypeOf(jpeg()).toEqualTypeOf<DecoderConfig>();
      expectTypeOf(png()).toEqualTypeOf<DecoderConfig>();
      expectTypeOf(webpDecoder()).toEqualTypeOf<DecoderConfig>();
      expectTypeOf(avif()).toEqualTypeOf<DecoderConfig>();
      expectTypeOf(jxl()).toEqualTypeOf<DecoderConfig>();
      expectTypeOf(qoi()).toEqualTypeOf<DecoderConfig>();

      // Encoder helpers should return EncoderConfig
      expectTypeOf(webp()).toEqualTypeOf<EncoderConfig>();
      expectTypeOf(jpegEncoder()).toEqualTypeOf<EncoderConfig>();
      expectTypeOf(pngEncoder()).toEqualTypeOf<EncoderConfig>();
      expectTypeOf(avifEncoder()).toEqualTypeOf<EncoderConfig>();
      expectTypeOf(jxlEncoder()).toEqualTypeOf<EncoderConfig>();
      expectTypeOf(qoiEncoder()).toEqualTypeOf<EncoderConfig>();
    });
  });
});