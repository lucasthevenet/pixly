import { describe, it, expect, expectTypeOf } from "vitest";
import type {
  ProcessingResult,
  ImageBuilder,
  BuilderConfig,
  Preset,
  BuilderState,
} from "./composable-types";
import type { MimeType, OperationFunction, ImageInput, Decoder, Encoder } from "./types";

describe("Composable API Types", () => {
  describe("Decoder and Encoder Functions", () => {
    it("should accept decoder functions", () => {
      const mockDecoder: Decoder = async (buffer: ArrayBuffer) => new ImageData(1, 1);
      expectTypeOf(mockDecoder).toEqualTypeOf<Decoder>();
      expectTypeOf(mockDecoder).parameter(0).toEqualTypeOf<ArrayBuffer>();
      expectTypeOf(mockDecoder).returns.toEqualTypeOf<Promise<ImageData>>();
    });

    it("should accept encoder functions", () => {
      const mockEncoder: Encoder = async (image: ImageData) => new ArrayBuffer(0);
      expectTypeOf(mockEncoder).toEqualTypeOf<Encoder>();
      expectTypeOf(mockEncoder).parameter(0).toEqualTypeOf<ImageData>();
      expectTypeOf(mockEncoder).returns.toEqualTypeOf<Promise<ArrayBuffer>>();
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
      const mockDecoder: Decoder = async () => new ImageData(1, 1);
      const mockEncoder: Encoder = async () => new ArrayBuffer(0);
      
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
      expectTypeOf(mockBuilder.decoder).parameter(0).toEqualTypeOf<Decoder>();
      expectTypeOf(mockBuilder.decoder).returns.toEqualTypeOf<ImageBuilder>();
      expectTypeOf(mockBuilder.encoder).parameter(0).toEqualTypeOf<Encoder>();
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

    it("should accept decoder function", () => {
      const mockDecoder: Decoder = async () => new ImageData(1, 1);
      const config: BuilderConfig = {
        decoder: mockDecoder,
      };
      expect(config.decoder).toBeDefined();
      expectTypeOf(config.decoder).toEqualTypeOf<Decoder | undefined>();
    });

    it("should accept encoder function", () => {
      const mockEncoder: Encoder = async () => new ArrayBuffer(0);
      const config: BuilderConfig = {
        encoder: mockEncoder,
      };
      expect(config.encoder).toBeDefined();
      expectTypeOf(config.encoder).toEqualTypeOf<Encoder | undefined>();
    });
  });

  describe("BuilderState", () => {
    it("should contain required internal state fields", () => {
      const mockDecoder: Decoder = async () => new ImageData(1, 1);
      const mockEncoder: Encoder = async () => new ArrayBuffer(0);
      
      const state: BuilderState = {
        operations: [],
        decoder: mockDecoder,
        encoder: mockEncoder,
      };

      expectTypeOf(state.operations).toEqualTypeOf<OperationFunction[]>();
      expectTypeOf(state.decoder).toEqualTypeOf<Decoder>();
      expectTypeOf(state.encoder).toEqualTypeOf<Encoder>();
    });
  });

  describe("Function Integration", () => {
    it("should work with actual decoder and encoder functions", () => {
      // Test that the types integrate properly with real function signatures
      const mockDecoder: Decoder = async (buffer: ArrayBuffer): Promise<ImageData> => {
        // Simulate decoding
        return new ImageData(100, 100);
      };

      const mockEncoder: Encoder = async (image: ImageData): Promise<ArrayBuffer> => {
        // Simulate encoding
        return new ArrayBuffer(image.width * image.height * 4);
      };

      // These should type-check correctly
      expectTypeOf(mockDecoder).toEqualTypeOf<Decoder>();
      expectTypeOf(mockEncoder).toEqualTypeOf<Encoder>();

      // Test that they can be used in configs
      const config: BuilderConfig = {
        decoder: mockDecoder,
        encoder: mockEncoder,
      };

      expect(config.decoder).toBe(mockDecoder);
      expect(config.encoder).toBe(mockEncoder);
    });
  });
});