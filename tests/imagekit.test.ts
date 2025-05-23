import { describe, expect, it } from "vitest";
import { ImageKit } from "../src/imagekit";

describe("ImageKit API surface", () => {
  // it("should have a static from method", () => {
  //   expect(typeof ImageKit.from).toBe("function");
  // });

  // it("should round-trip a Uint8Array buffer unchanged", async () => {
  //   const input = new Uint8Array([1, 2, 3, 4, 5]);
  //   const kit = await ImageKit.from(input);
  //   const out = await kit.toBuffer();
  //   expect(out).toEqual(input);
  // });

  it("decoding > should decode a PNG buffer to a bitmap", async () => {
    // 1x1 transparent PNG
    const pngData = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
    const kit = await ImageKit.from(pngData);
    // Access internal bitmap for test (not public API)
    // @ts-expect-error
    const bitmap = kit._bitmap;
    expect(bitmap).not.toBeNull();
    expect(bitmap!.width).toBe(1);
    expect(bitmap!.height).toBe(1);
    expect(bitmap!.data.length).toBe(4);
    // Transparent pixel
    expect(Array.from(bitmap!.data)).toEqual([0, 0, 0, 0]);
  });

  it("encoding > should encode a decoded PNG bitmap back to PNG", async () => {
    // 1x1 transparent PNG
    const pngData = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
    const kit = await ImageKit.from(pngData);
    const outPng = await kit.toBuffer({ format: "image/png" });
    // Should produce a valid PNG (starts with PNG signature)
    expect(Array.from(outPng.slice(0, 8))).toEqual([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    // Should be decodable again
    const kit2 = await ImageKit.from(outPng);
    // @ts-expect-error
    const bitmap2 = kit2._bitmap;
    expect(bitmap2).not.toBeNull();
    expect(bitmap2!.width).toBe(1);
    expect(bitmap2!.height).toBe(1);
    expect(Array.from(bitmap2!.data)).toEqual([0, 0, 0, 0]);
  });

  it("should instantiate and expose transformation methods", async () => {
    const kit = await ImageKit.from(new Uint8Array([0]));
    expect(typeof kit.resize).toBe("function");
    expect(typeof kit.rotate).toBe("function");
    expect(typeof kit.flip).toBe("function");
    expect(typeof kit.crop).toBe("function");
    expect(typeof kit._convert).toBe("function");
  });

  it("should expose output methods", async () => {
    const kit = await ImageKit.from(new Uint8Array([0]));
    expect(typeof kit.toBuffer).toBe("function");
    expect(typeof kit.toBlob).toBe("function");
    expect(typeof kit.toDataURL).toBe("function");
  });

  // it("should allow chaining of transformation methods", async () => {
  //   const kit = await ImageKit.from(new Uint8Array([0]));
  //   expect(
  //     kit
  //       .resize({ width: 100 })
  //       .flip("horizontal")
  //       .crop(0, 0, 10, 10),
  //   ).toBeInstanceOf(ImageKit);
  // });

  // it("should accept OutputOptions in output methods", async () => {
  //   const kit = await ImageKit.from(new Uint8Array([0]));
  //   await expect(
  //     kit.toBuffer({ format: "jpeg" } as OutputOptions),
  //   ).resolves.toBeInstanceOf(Uint8Array);
  //   await expect(
  //     kit.toDataURL({ format: "png" } as OutputOptions),
  //   ).resolves.toBeTypeOf("string");
  //   await expect(
  //     kit.toBlob({ format: "webp" } as OutputOptions),
  //   ).rejects.toThrow();
  // });
});
