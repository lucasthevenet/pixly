import type {
  Decoder,
  Encoder,
  OperationFunction,
  ImageInput,
} from "./types";
import type { ProcessingResult, Preset, BuilderConfig, ImageBuilder as ImageBuilderType } from "./composable-types";

/**
 * Minimal ProcessingResult stub (full implementation to follow in next phase).
 */
class BaseProcessingResult implements ProcessingResult {
  constructor(private imageData: ImageData) {}

  async toBuffer(): Promise<Uint8Array> {
    throw new Error("toBuffer not implemented yet.");
  }
  async toBlob(): Promise<Blob> {
    throw new Error("toBlob not implemented yet.");
  }
  async toDataURL(): Promise<string> {
    throw new Error("toDataURL not implemented yet.");
  }
  getImageData(): ImageData {
    return this.imageData;
  }
}

/**
 * ImageBuilder: Composable pipeline builder for Pixly.
 */
export class ImageBuilder implements ImageBuilderType {
  private readonly ops: OperationFunction[];
  private readonly dec: Decoder;
  private readonly enc: Encoder;

  constructor(config: BuilderConfig = {}, operations: OperationFunction[] = []) {
    this.dec =
      config.decoder ??
      (async () => {
        throw new Error("No decoder set on pipeline.");
      });
    this.enc =
      config.encoder ??
      (async () => {
        throw new Error("No encoder set on pipeline.");
      });
    this.ops = operations;
  }

  apply(op: OperationFunction): ImageBuilder {
    return new ImageBuilder(
      { decoder: this.dec, encoder: this.enc },
      [...this.ops, op]
    );
  }

  decoder(decoderFn: Decoder): ImageBuilder {
    return new ImageBuilder(
      { decoder: decoderFn, encoder: this.enc },
      this.ops
    );
  }

  encoder(encoderFn: Encoder): ImageBuilder {
    return new ImageBuilder(
      { decoder: this.dec, encoder: encoderFn },
      this.ops
    );
  }

  preset(): Preset {
    return async (image: ImageData) => {
      let result = image;
      for (const op of this.ops) {
        result = await op(result);
      }
      return result;
    };
  }

  async process(input: ImageInput): Promise<ProcessingResult> {
    // This is a stub; Actual output encoding and result type will be added later.
    const buffer = typeof input === "string"
      ? await (await fetch(input)).arrayBuffer()
      : input instanceof ArrayBuffer
      ? input
      : input instanceof Uint8Array
      ? input.buffer
      : input instanceof Blob || input instanceof File
      ? await input.arrayBuffer()
      : (() => { throw new Error("Invalid input"); })();

    const initialImage = await this.dec(buffer as ArrayBuffer);
    let resultData = initialImage;
    for (const op of this.ops) {
      resultData = await op(resultData);
    }
    // Not actually encoded yet, just placeholder
    return new BaseProcessingResult(resultData);
  }
}

// Default export for convenience (optional)
export default ImageBuilder;
