import { AvifHandler } from "./handlers/avif";
import { JpegHandler } from "./handlers/jpeg";
import { JxlHandler } from "./handlers/jxl";
import { PngHandler } from "./handlers/png";
import { QoiHandler } from "./handlers/qoi";
import { WebpHandler } from "./handlers/webp";
import { cropImage } from "./operations/crop";
import { flipImage } from "./operations/flip";
import { resizeImage, type ResizeOptions } from "./operations/js-resize";
import { rotateImage } from "./operations/rotate";
import type {
  MimeType,
  ImageHandler,
  Color,
  FlipDirection,
  CropOptions,
  TransformOptions,
} from "./types";
import { ensureDecodeWasmLoadedNode, ensureWasmLoaded } from "./wasm-util";

const typeHandlers: Record<MimeType, ImageHandler> = {
  "image/png": PngHandler,
  "image/jpeg": JpegHandler,
  "image/avif": AvifHandler,
  "image/webp": WebpHandler,
  "image/qoi": QoiHandler,
  "image/jxl": JxlHandler,
};

interface OutputOptions extends TransformOptions {
  format: MimeType;
}

// Operation types for the builder pattern
interface Operation {
  type: "resize" | "rotate" | "flip" | "crop";
  params: unknown;
}

interface ResizeOperation extends Operation {
  type: "resize";
  params: ResizeOptions;
}

interface RotateOperation extends Operation {
  type: "rotate";
  params: { angle: number; color: Color };
}

interface FlipOperation extends Operation {
  type: "flip";
  params: { direction: FlipDirection };
}

interface CropOperation extends Operation {
  type: "crop";
  params: CropOptions;
}

type ImageOperation =
  | ResizeOperation
  | RotateOperation
  | FlipOperation
  | CropOperation;

// Factory configuration interfaces
interface ProcessingConfig {
  decoder?: "auto" | MimeType;
  encoder?: MimeType;
  quality?: number;
  preserveMetadata?: boolean;
}

interface PipelineTemplate {
  name: string;
  operations: ImageOperation[];
  outputFormat: MimeType;
}

/**
 * Internal ImageKit processor - handles the actual image processing
 */
class ImageKitProcessor {
  private _buffer: Uint8Array = new Uint8Array();
  private _bitmap: ImageData | null = null;
  private _config: ProcessingConfig;

  constructor(
    buffer: Uint8Array,
    bitmap: ImageData | null,
    config: ProcessingConfig = {},
  ) {
    this._buffer = buffer;
    this._bitmap = bitmap;
    this._config = config;
  }

  async applyOperations(operations: ImageOperation[]): Promise<void> {
    for (const operation of operations) {
      await this.applyOperation(operation);
    }
  }

  private async applyOperation(operation: ImageOperation): Promise<void> {
    if (!this._bitmap) return;

    switch (operation.type) {
      case "resize":
        this._bitmap = await resizeImage(this._bitmap, operation.params);
        break;
      case "rotate":
        this._bitmap = await rotateImage(
          this._bitmap,
          operation.params.angle,
          operation.params.color,
        );
        break;
      case "flip":
        this._bitmap = await flipImage(
          this._bitmap,
          operation.params.direction,
        );
        break;
      case "crop":
        this._bitmap = await cropImage(this._bitmap, operation.params);
        break;
    }
  }

  async convert(opts: OutputOptions): Promise<Uint8Array<ArrayBuffer>> {
    const format = this._config.encoder || opts.format;
    const handler = typeHandlers[format];

    if (!handler || !this._bitmap) {
      throw new Error("Failed to encode into format");
    }

    const encodeOptions = {
      width: this._bitmap.width,
      height: this._bitmap.height,
      quality: this._config.quality,
      ...opts,
    };

    const result = await handler.encode(this._bitmap, encodeOptions);
    return new Uint8Array(result);
  }

  async toBuffer(opts: OutputOptions): Promise<Uint8Array> {
    if (!this._bitmap) return this._buffer;
    return this.convert(opts);
  }

  async toBlob(opts: OutputOptions): Promise<Blob> {
    const buffer = await this.toBuffer(opts);
    const format = this._config.encoder || opts.format;
    return new Blob([buffer], { type: format });
  }

  async toDataURL(opts: OutputOptions): Promise<string> {
    const buffer = await this.toBuffer(opts);
    const format = this._config.encoder || opts.format;
    const base64 = btoa(String.fromCharCode(...buffer));
    return `data:${format};base64,${base64}`;
  }

  static getFormatFromMagicBytes(magic: Uint8Array): MimeType | undefined {
    if (
      magic[0] === 0x89 &&
      magic[1] === 0x50 &&
      magic[2] === 0x4e &&
      magic[3] === 0x47
    ) {
      return "image/png";
    }
    if (magic[0] === 0xff && magic[1] === 0xd8) {
      return "image/jpeg";
    }
    if (
      magic[0] === 0x52 &&
      magic[1] === 0x49 &&
      magic[2] === 0x46 &&
      magic[3] === 0x46 &&
      magic[8] === 0x57 &&
      magic[9] === 0x45 &&
      magic[10] === 0x42 &&
      magic[11] === 0x50
    ) {
      return "image/webp";
    }
    if (
      magic[0] === 0x00 &&
      magic[1] === 0x00 &&
      magic[2] === 0x00 &&
      magic[3] === 0x0c &&
      magic[4] === 0x6a &&
      magic[5] === 0x58 &&
      magic[6] === 0x4c &&
      magic[7] === 0x20
    ) {
      return "image/jxl";
    }
    if (
      magic[0] === 0x00 &&
      magic[1] === 0x00 &&
      magic[2] === 0x00 &&
      magic[3] === 0x1c &&
      magic[4] === 0x66 &&
      magic[5] === 0x74 &&
      magic[6] === 0x79 &&
      magic[7] === 0x70 &&
      magic[8] === 0x61 &&
      magic[9] === 0x76 &&
      magic[10] === 0x69 &&
      magic[11] === 0x66
    ) {
      return "image/avif";
    }
    if (
      magic[0] === 0x71 &&
      magic[1] === 0x6f &&
      magic[2] === 0x69 &&
      magic[3] === 0x66
    ) {
      return "image/qoi";
    }
    return undefined;
  }
}

/**
 * ImageKit Pipeline - represents a sequence of operations
 */
export class ImageKitPipeline {
  private _operations: ImageOperation[] = [];
  private _config: ProcessingConfig;

  constructor(config: ProcessingConfig = {}) {
    this._config = config;
  }

  // Builder methods for pipeline creation
  resize(opts: ResizeOptions): this {
    this._operations.push({ type: "resize", params: opts });
    return this;
  }

  rotate(angle: number, color: Color): this {
    this._operations.push({ type: "rotate", params: { angle, color } });
    return this;
  }

  flip(direction: FlipDirection): this {
    this._operations.push({ type: "flip", params: { direction } });
    return this;
  }

  crop(options: CropOptions): this {
    this._operations.push({ type: "crop", params: options });
    return this;
  }

  // Execute pipeline on input
  async process(
    input: ArrayBuffer | Uint8Array | Blob | File | string,
    outputOpts: OutputOptions,
  ): Promise<Uint8Array> {
    const { buffer, bitmap } = await this._loadInput(input);
    const processor = new ImageKitProcessor(buffer, bitmap, this._config);
    await processor.applyOperations(this._operations);
    return processor.toBuffer(outputOpts);
  }

  async processToBlob(
    input: ArrayBuffer | Uint8Array | Blob | File | string,
    outputOpts?: OutputOptions,
  ): Promise<Blob> {
    const defaultOpts: OutputOptions = {
      format: this._config.encoder || "image/png",
      ...outputOpts,
    };

    const { buffer, bitmap } = await this._loadInput(input);
    const processor = new ImageKitProcessor(buffer, bitmap, this._config);
    await processor.applyOperations(this._operations);
    return processor.toBlob(defaultOpts);
  }

  async processToDataURL(
    input: ArrayBuffer | Uint8Array | Blob | File | string,
    outputOpts?: OutputOptions,
  ): Promise<string> {
    const defaultOpts: OutputOptions = {
      format: this._config.encoder || "image/png",
      ...outputOpts,
    };

    const { buffer, bitmap } = await this._loadInput(input);
    const processor = new ImageKitProcessor(buffer, bitmap, this._config);
    await processor.applyOperations(this._operations);
    return processor.toDataURL(defaultOpts);
  }

  private async _loadInput(
    input: ArrayBuffer | Uint8Array | Blob | File | string,
  ): Promise<{ buffer: Uint8Array; bitmap: ImageData | null }> {
    let buffer: Uint8Array;

    if (typeof input === "string") {
      const res = await fetch(input);
      buffer = new Uint8Array(await res.arrayBuffer());
    } else if (input instanceof Blob || input instanceof File) {
      buffer = new Uint8Array(await input.arrayBuffer());
    } else if (input instanceof ArrayBuffer) {
      buffer = new Uint8Array(input);
    } else if (input instanceof Uint8Array) {
      buffer = input;
    } else {
      throw new Error("Unsupported input type");
    }

    let bitmap: ImageData | null = null;
    try {
      const magic = buffer.slice(0, 16);
      const format =
        this._config.decoder === "auto" || !this._config.decoder
          ? (ImageKitProcessor.getFormatFromMagicBytes(magic) ?? "image/png")
          : this._config.decoder;

      if (format in typeHandlers) {
        const result = await typeHandlers[format].decode(
          buffer.buffer as ArrayBuffer,
        );
        if (result) {
          bitmap = result;
        }
      }
    } catch (err) {
      console.log(err);
      bitmap = null;
    }

    return { buffer, bitmap };
  }
}

/**
 * Main Factory class for creating ImageKit instances and pipelines
 */
export class ImageKitFactory {
  // Input-based factory methods
  static async fromFile(
    file: File,
    config?: ProcessingConfig,
  ): Promise<ImageKit> {
    return ImageKit.from(file, config);
  }

  static async fromUrl(
    url: string,
    config?: ProcessingConfig,
  ): Promise<ImageKit> {
    return ImageKit.from(url, config);
  }

  static async fromBuffer(
    buffer: ArrayBuffer | Uint8Array,
    config?: ProcessingConfig,
  ): Promise<ImageKit> {
    return ImageKit.from(buffer, config);
  }

  static async fromBlob(
    blob: Blob,
    config?: ProcessingConfig,
  ): Promise<ImageKit> {
    return ImageKit.from(blob, config);
  }

  // Format-specific factory methods
  static async fromPng(
    input: ArrayBuffer | Uint8Array | Blob | File | string,
  ): Promise<ImageKit> {
    return ImageKit.from(input, { decoder: "image/png" });
  }

  static async fromJpeg(
    input: ArrayBuffer | Uint8Array | Blob | File | string,
  ): Promise<ImageKit> {
    return ImageKit.from(input, { decoder: "image/jpeg" });
  }

  static async fromWebp(
    input: ArrayBuffer | Uint8Array | Blob | File | string,
  ): Promise<ImageKit> {
    return ImageKit.from(input, { decoder: "image/webp" });
  }

  static async fromAvif(
    input: ArrayBuffer | Uint8Array | Blob | File | string,
  ): Promise<ImageKit> {
    return ImageKit.from(input, { decoder: "image/avif" });
  }

  // Pipeline factory methods
  static createPipeline(config?: ProcessingConfig): ImageKitPipeline {
    return new ImageKitPipeline(config);
  }

  // Preset pipelines
  static createThumbnailPipeline(size: number = 150): ImageKitPipeline {
    return new ImageKitPipeline({ encoder: "image/jpeg", quality: 80 }).resize({
      width: size,
      height: size,
      fit: "cover",
    });
  }

  static createWebOptimizedPipeline(maxWidth: number = 1920): ImageKitPipeline {
    return new ImageKitPipeline({ encoder: "image/webp", quality: 85 }).resize({
      width: maxWidth,
      fit: "inside",
    });
  }

  static createCompressionPipeline(quality: number = 60): ImageKitPipeline {
    return new ImageKitPipeline({ encoder: "image/jpeg", quality });
  }

  // Template-based factory
  static createFromTemplate(template: PipelineTemplate): ImageKitPipeline {
    const pipeline = new ImageKitPipeline({ encoder: template.outputFormat });
    template.operations.forEach((op) => {
      switch (op.type) {
        case "resize":
          pipeline.resize(op.params);
          break;
        case "rotate":
          pipeline.rotate(op.params.angle, op.params.color);
          break;
        case "flip":
          pipeline.flip(op.params.direction);
          break;
        case "crop":
          pipeline.crop(op.params);
          break;
      }
    });
    return pipeline;
  }

  // Strategy factory
  static createWithStrategy(
    strategy: "speed" | "quality" | "size",
  ): (config?: ProcessingConfig) => ImageKitPipeline {
    const strategies = {
      speed: { encoder: "image/jpeg" as MimeType, quality: 70 },
      quality: { encoder: "image/png" as MimeType, preserveMetadata: true },
      size: { encoder: "image/webp" as MimeType, quality: 60 },
    };

    return (config?: ProcessingConfig) => {
      return new ImageKitPipeline({ ...strategies[strategy], ...config });
    };
  }
}

/**
 * ImageKit Builder - updated to work with factory pattern
 */
export class ImageKit {
  private _buffer: Uint8Array;
  private _bitmap: ImageData | null;
  private _operations: ImageOperation[] = [];
  private _config: ProcessingConfig;

  private constructor(
    buffer: Uint8Array,
    bitmap: ImageData | null,
    config: ProcessingConfig = {},
  ) {
    this._buffer = buffer;
    this._bitmap = bitmap;
    this._config = config;
  }

  // Updated factory method with config support
  static async from(
    input: ArrayBuffer | Uint8Array | Blob | File | string,
    config: ProcessingConfig = {},
  ): Promise<ImageKit> {
    let buffer: Uint8Array;

    if (typeof input === "string") {
      const res = await fetch(input);
      buffer = new Uint8Array(await res.arrayBuffer());
    } else if (input instanceof Blob || input instanceof File) {
      buffer = new Uint8Array(await input.arrayBuffer());
    } else if (input instanceof ArrayBuffer) {
      buffer = new Uint8Array(input);
    } else if (input instanceof Uint8Array) {
      buffer = input;
    } else {
      throw new Error("Unsupported input type");
    }

    let bitmap: ImageData | null = null;
    try {
      const magic = buffer.slice(0, 16);
      const format =
        config.decoder === "auto" || !config.decoder
          ? (ImageKitProcessor.getFormatFromMagicBytes(magic) ?? "image/png")
          : config.decoder;

      if (format in typeHandlers) {
        const result = await typeHandlers[format].decode(
          buffer.buffer as ArrayBuffer,
        );
        if (result) {
          bitmap = result;
        }
      }
    } catch (err) {
      console.log(err);
      bitmap = null;
    }

    return new ImageKit(buffer, bitmap, config);
  }

  // Builder methods
  resize(opts: ResizeOptions): this {
    this._operations.push({ type: "resize", params: opts });
    return this;
  }

  rotate(angle: number, color: Color): this {
    this._operations.push({ type: "rotate", params: { angle, color } });
    return this;
  }

  flip(direction: FlipDirection): this {
    this._operations.push({ type: "flip", params: { direction } });
    return this;
  }

  crop(options: CropOptions): this {
    this._operations.push({ type: "crop", params: options });
    return this;
  }

  // Terminal methods
  async toBuffer(opts: OutputOptions): Promise<Uint8Array> {
    const processor = new ImageKitProcessor(
      this._buffer,
      this._bitmap,
      this._config,
    );
    await processor.applyOperations(this._operations);
    return processor.toBuffer(opts);
  }

  async toBlob(opts?: OutputOptions): Promise<Blob> {
    const defaultOpts: OutputOptions = {
      format: this._config.encoder || "image/png",
      ...opts,
    };

    const processor = new ImageKitProcessor(
      this._buffer,
      this._bitmap,
      this._config,
    );
    await processor.applyOperations(this._operations);
    return processor.toBlob(defaultOpts);
  }

  async toDataURL(opts?: OutputOptions): Promise<string> {
    const defaultOpts: OutputOptions = {
      format: this._config.encoder || "image/png",
      ...opts,
    };

    const processor = new ImageKitProcessor(
      this._buffer,
      this._bitmap,
      this._config,
    );
    await processor.applyOperations(this._operations);
    return processor.toDataURL(defaultOpts);
  }
}
