// ImageKit: Isomorphic image transformation/compression API (browser & Node)
// NOTE: Implementation stubs only; real logic to be filled in vertical slices.

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

/**
 * Internal ImageKit processor - handles the actual image processing
 */
class ImageKitProcessor {
  private _buffer: Uint8Array = new Uint8Array();
  private _bitmap: ImageData | null = null; // decoded RGBA bitmap

  constructor(buffer: Uint8Array, bitmap: ImageData | null) {
    this._buffer = buffer;
    this._bitmap = bitmap;
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
    const handler = typeHandlers[opts.format];

    if (!handler || !this._bitmap) {
      throw new Error("Failed to encode into format");
    }

    const result = await handler.encode(this._bitmap, {
      width: this._bitmap.width,
      height: this._bitmap.height,
      ...opts,
    });

    return new Uint8Array(result);
  }

  async toBuffer(opts: OutputOptions): Promise<Uint8Array> {
    // If no bitmap, fallback to passthrough
    if (!this._bitmap) return this._buffer;
    return this.convert(opts);
  }

  async toBlob(opts: OutputOptions): Promise<Blob> {
    const buffer = await this.toBuffer(opts);
    return new Blob([buffer], { type: opts.format });
  }

  async toDataURL(opts: OutputOptions): Promise<string> {
    const buffer = await this.toBuffer(opts);
    const base64 = btoa(String.fromCharCode(...buffer));
    return `data:${opts.format};base64,${base64}`;
  }

  /**
   * Detects image format from magic bytes.
   * Returns one of: 'png', 'jpeg', 'webp', 'jxl', 'avif', 'qoi', or undefined.
   */
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
 * ImageKit Builder - provides a fluent API for image transformations
 */
export class ImageKit {
  private _buffer: Uint8Array;
  private _bitmap: ImageData | null;
  private _operations: ImageOperation[] = [];

  private constructor(buffer: Uint8Array, bitmap: ImageData | null) {
    this._buffer = buffer;
    this._bitmap = bitmap;
  }

  // Factory method
  static async from(
    input: ArrayBuffer | Uint8Array | Blob | File | string,
  ): Promise<ImageKit> {
    let buffer: Uint8Array;

    if (typeof input === "string") {
      // Assume URL, fetch as ArrayBuffer
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

    // Try to decode using @jsquash decoders (browser/Node)
    let bitmap: ImageData | null = null;
    try {
      // Detect format by magic bytes
      const magic = buffer.slice(0, 16);
      const format =
        ImageKitProcessor.getFormatFromMagicBytes(magic) ?? "image/png";

      if (format in typeHandlers) {
        console.log("Decoder found, attempting to decode...", buffer);
        const result = await typeHandlers[format].decode(
          buffer.buffer as ArrayBuffer,
        );
        console.log("Decode result:", result);
        if (result) {
          bitmap = result;
        }
      } else {
        console.log("No decoder found for magic bytes:", Array.from(magic));
      }
    } catch (err) {
      console.log(err);
      // fallback: leave bitmap null
      bitmap = null;
    }

    return new ImageKit(buffer, bitmap);
  }

  // Builder methods - these return this for chaining
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

  // Terminal methods - these execute the operations and return results
  async toBuffer(opts: OutputOptions): Promise<Uint8Array> {
    const processor = new ImageKitProcessor(this._buffer, this._bitmap);
    await processor.applyOperations(this._operations);
    return processor.toBuffer(opts);
  }

  async toBlob(opts?: OutputOptions): Promise<Blob> {
    const defaultOpts: OutputOptions = {
      format: "image/png",
      ...opts,
    };

    const processor = new ImageKitProcessor(this._buffer, this._bitmap);
    await processor.applyOperations(this._operations);
    return processor.toBlob(defaultOpts);
  }

  async toDataURL(opts?: OutputOptions): Promise<string> {
    const defaultOpts: OutputOptions = {
      format: "image/png",
      ...opts,
    };

    const processor = new ImageKitProcessor(this._buffer, this._bitmap);
    await processor.applyOperations(this._operations);
    return processor.toDataURL(defaultOpts);
  }
}
