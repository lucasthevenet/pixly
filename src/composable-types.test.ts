import { describe, it, expect, expectTypeOf } from "vitest";
import type {
  DecoderConfig,
  EncoderConfig,
  ProcessingResult,
  ImageBuilder,
  BuilderConfig,
  Preset,
  BuilderState,
  WebpEncoderOptions,
  JpegEncoderOptions,
  PngEncoderOptions,
  AvifEncoderOptions,
  JxlEncoderOptions,
  QoiEncoderOptions,
} from "./composable-types";
import type { MimeType, OperationFunction, ImageInput } from "./types";

describe("Composable API Types", () => {
  describe("DecoderConfig", () => {
    it("should accept auto type", () => {
      const config: DecoderConfig = {
        type: "auto",
        preserveMetadata: true,
      };
      expect(config.type).toBe("auto");
    });

    it("should accept specific mime types", () => {
      const config: DecoderConfig = {
        type: "image/jpeg",
        preserveMetadata: false,
      };
      expectTypeOf(config.type).toEqualTypeOf<"auto" | MimeType>();
    });

    it("should make preserveMetadata optional", () => {
      const config: DecoderConfig = {
        type: "image/png",
      };
      expect(config.preserveMetadata).toBeUndefined();
    });
  });

  describe("EncoderConfig", () => {
    it("should require format field", () => {
      const config: EncoderConfig = {
        format: "image/webp",
        quality: 80,
      };
      expectTypeOf(config.format).toEqualTypeOf<MimeType>();
    });

    it("should make all options except format optional", () => {
      const config: EncoderConfig = {
        format: "image/jpeg",
      };
      expect(config.quality).toBeUndefined();
      expect(config.compressionLevel).toBeUndefined();
    });

    it("should accept all optional properties", () => {
      const config: EncoderConfig = {
        format: "image/webp",
        quality: 90,
        compressionLevel: 8,
        loop: 0,
        delay: 100,
      };
      expect(config).toHaveProperty("format");
      expect(config).toHaveProperty("quality");
      expect(config).toHaveProperty("compressionLevel");
      expect(config).toHaveProperty("loop");
      expect(config).toHaveProperty("delay");
    });
  });

  describe("Preset", () => {
    it("should be an OperationFunction", () => {
      expectTypeOf<Preset>().toEqualTypeOf<OperationFunction>();
    });
  });

  describe("ProcessingResult", () => {
    it("should have correct method signatures", () => {
      const mockResult: ProcessingResult = {
        toBuffer: async () => new Uint8Array(),
        toBlob: async () => new Blob(),
        toDataURL: async () => "data:image/png;base64,",
        getImageData: () => new ImageData(1, 1),
      };

      expectTypeOf(mockResult.toBuffer).toEqualTypeOf<() => Promise<Uint8Array>>();
      expectTypeOf(mockResult.toBlob).toEqualTypeOf<() => Promise<Blob>>();
      expectTypeOf(mockResult.toDataURL).toEqualTypeOf<() => Promise<string>>();
      expectTypeOf(mockResult.getImageData).toEqualTypeOf<() => ImageData>();
    });
  });

  describe("ImageBuilder", () => {
    it("should have fluent interface methods", () => {
      const mockBuilder: ImageBuilder = {
        apply: () => mockBuilder,
        decoder: () => mockBuilder,
        encoder: () => mockBuilder,
        preset: () => async () => new ImageData(1, 1),
        process: async () => ({
          toBuffer: async () => new Uint8Array(),
          toBlob: async () => new Blob(),
          toDataURL: async () => "",
          getImageData: () => new ImageData(1, 1),
        }),
      };

      expectTypeOf(mockBuilder.apply).parameter(0).toEqualTypeOf<OperationFunction>();
      expectTypeOf(mockBuilder.apply).returns.toEqualTypeOf<ImageBuilder>();
      expectTypeOf(mockBuilder.decoder).returns.toEqualTypeOf<ImageBuilder>();
      expectTypeOf(mockBuilder.encoder).returns.toEqualTypeOf<ImageBuilder>();
      expectTypeOf(mockBuilder.preset).returns.toEqualTypeOf<Preset>();
      expectTypeOf(mockBuilder.process).parameter(0).toEqualTypeOf<ImageInput>();
      expectTypeOf(mockBuilder.process).returns.toEqualTypeOf<Promise<ProcessingResult>>();
    });
  });

  describe("BuilderConfig", () => {
    it("should make all properties optional", () => {
      const config: BuilderConfig = {};
      expect(config).toBeDefined();
    });

    it("should accept decoder config", () => {
      const config: BuilderConfig = {
        decoder: { type: "auto" },
      };
      expect(config.decoder).toBeDefined();
    });

    it("should accept encoder config", () => {
      const config: BuilderConfig = {
        encoder: { format: "image/webp", quality: 80 },
      };
      expect(config.encoder).toBeDefined();
    });
  });

  describe("BuilderState", () => {
    it("should contain required internal state fields", () => {
      const state: BuilderState = {
        operations: [],
        decoderConfig: { type: "auto" },
        encoderConfig: { format: "image/png" },
      };

      expectTypeOf(state.operations).toEqualTypeOf<OperationFunction[]>();
      expectTypeOf(state.decoderConfig).toEqualTypeOf<DecoderConfig>();
      expectTypeOf(state.encoderConfig).toEqualTypeOf<EncoderConfig>();
    });
  });

  describe("Format-specific encoder options", () => {
    it("should have correct WebP options", () => {
      const options: WebpEncoderOptions = {
        quality: 80,
        compressionLevel: 9,
      };
      expectTypeOf(options.quality).toEqualTypeOf<number | undefined>();
      expectTypeOf(options.compressionLevel).toEqualTypeOf<number | undefined>();
    });

    it("should have correct JPEG options", () => {
      const options: JpegEncoderOptions = {
        quality: 90,
      };
      expectTypeOf(options.quality).toEqualTypeOf<number | undefined>();
    });

    it("should have correct PNG options", () => {
      const options: PngEncoderOptions = {
        compressionLevel: 8,
      };
      expectTypeOf(options.compressionLevel).toEqualTypeOf<number | undefined>();
    });

    it("should have correct AVIF options", () => {
      const options: AvifEncoderOptions = {
        quality: 85,
      };
      expectTypeOf(options.quality).toEqualTypeOf<number | undefined>();
    });

    it("should have correct JXL options", () => {
      const options: JxlEncoderOptions = {
        quality: 75,
      };
      expectTypeOf(options.quality).toEqualTypeOf<number | undefined>();
    });

    it("should have empty QOI options", () => {
      const options: QoiEncoderOptions = {};
      expect(options).toBeDefined();
    });
  });
});