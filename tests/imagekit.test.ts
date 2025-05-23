import { expect, it } from "vitest";
import {
  createImageProcessor,
  createFunctionalBuilder,
  createPipeline,
  addResize,
  addFlip,
  addCrop,
  addRotate,
  processPipeline,
  toBuffer,
  toBlob,
  toDataURL,
  resize,
  rotate,
  flip,
  crop,
  pipe,
  compose,
  createThumbnailPipeline,
  createPipelineFromTemplate,
  createSpeedOptimizedPipeline,
  createQualityOptimizedPipeline,
  createSizeOptimizedPipeline,
  type ProcessingConfig,
  type PipelineTemplate,
} from "../src/index";
import { getTestImage } from "./utils";

it("API surface - should handle invalid input types gracefully", async () => {
  // @ts-expect-error - testing invalid input
  await expect(createImageProcessor(null)).rejects.toThrow(
    "Unsupported input type",
  );
  // @ts-expect-error - testing invalid input
  await expect(createImageProcessor(123)).rejects.toThrow(
    "Unsupported input type",
  );
  // @ts-expect-error - testing invalid input
  await expect(createImageProcessor({})).rejects.toThrow(
    "Unsupported input type",
  );
});

it("API surface - should handle corrupted image data gracefully", async () => {
  const corruptedData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]); // Invalid JPEG header
  const processor = await createImageProcessor(corruptedData);
  expect(processor.bitmap).toBeNull(); // Should fail to decode but not throw
  expect(processor.buffer).toEqual(corruptedData);
});

it("API surface - decoding should decode a PNG buffer to a bitmap", async () => {
  // 1x1 transparent PNG
  const pngData = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
  const processor = await createImageProcessor(pngData);
  expect(processor.bitmap).not.toBeNull();
  expect(processor.bitmap!.width).toBe(1);
  expect(processor.bitmap!.height).toBe(1);
  expect(processor.bitmap!.data.length).toBe(4);
  // Transparent pixel
  expect(Array.from(processor.bitmap!.data)).toEqual([0, 0, 0, 0]);
});

it("API surface - encoding should encode a decoded PNG bitmap back to PNG", async () => {
  // 1x1 transparent PNG
  const pngData = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
  const processor = await createImageProcessor(pngData);
  const outPng = await toBuffer(processor, { format: "image/png" });
  // Should produce a valid PNG (starts with PNG signature)
  expect(Array.from(outPng.slice(0, 8))).toEqual([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  // Should be decodable again
  const processor2 = await createImageProcessor(outPng);
  expect(processor2.bitmap).not.toBeNull();
  expect(processor2.bitmap!.width).toBe(1);
  expect(processor2.bitmap!.height).toBe(1);
  expect(Array.from(processor2.bitmap!.data)).toEqual([0, 0, 0, 0]);
});

it("API surface - functional builder should allow chaining of transformation methods", async () => {
  const builder = createFunctionalBuilder();
  const chainedBuilder = builder.flip("horizontal").crop({
    height: 10,
    width: 10,
    x: 0,
    y: 0,
    background: [0, 0, 0, 0],
  });

  expect(typeof chainedBuilder.toBuffer).toBe("function");
  expect(typeof chainedBuilder.toBlob).toBe("function");
  expect(typeof chainedBuilder.toDataURL).toBe("function");
});

it("API surface - functional builder should accept OutputOptions in output methods", async () => {
  const builder = createFunctionalBuilder();
  const input = new Uint8Array([0]);

  await expect(
    builder.toBuffer(input, { format: "image/jpeg" }),
  ).resolves.toBeInstanceOf(Uint8Array);

  await expect(
    builder.toDataURL(input, { format: "image/png" }),
  ).resolves.toBeTypeOf("string");

  await expect(
    builder.toBlob(input, { format: "image/webp" }),
  ).resolves.toBeInstanceOf(Blob);
});

it("API surface - pipeline should work with operations", async () => {
  let pipeline = createPipeline();
  pipeline = addFlip(pipeline, "horizontal");
  pipeline = addCrop(pipeline, {
    height: 50,
    width: 50,
    x: 0,
    y: 0,
    background: [0, 0, 0, 0],
  });

  const input = await getTestImage("original");
  const result = await processPipeline(pipeline, input, {
    format: "image/jpeg",
  });
  expect(result).toBeInstanceOf(Uint8Array);
});

it("API surface - should support format-specific factories", async () => {
  const input = new Uint8Array([0]);

  const pngProcessor = await createImageProcessor(input, {
    decoder: "image/png",
  });
  expect(pngProcessor.config.decoder).toBe("image/png");

  const jpegProcessor = await createImageProcessor(input, {
    decoder: "image/jpeg",
  });
  expect(jpegProcessor.config.decoder).toBe("image/jpeg");

  const webpProcessor = await createImageProcessor(input, {
    decoder: "image/webp",
  });
  expect(webpProcessor.config.decoder).toBe("image/webp");
});

it("API surface - should support output format conversion with functional approach", async () => {
  const processor = await createImageProcessor(await getTestImage("square"));

  const buffer = await toBuffer(processor, { format: "image/png" });
  expect(buffer).toBeInstanceOf(Uint8Array);

  const blob = await toBlob(processor, { format: "image/webp" });
  expect(blob).toBeInstanceOf(Blob);
  expect(blob.type).toBe("image/webp");

  const dataUrl = await toDataURL(processor, { format: "image/webp" });
  expect(dataUrl).toBeTypeOf("string");
  expect(dataUrl).toMatch(/^data:image\/webp;base64,/);
});

it("Operations - should apply resize operation correctly", async () => {
  const validPngData = await getTestImage();
  const processor = await createImageProcessor(validPngData);
  const resizeOp = resize({
    width: 100,
    height: 100,
    background: [0, 0, 0, 0],
    fit: "contain",
    position: "center",
  });
  const result = await resizeOp(processor);

  expect(result).not.toBe(processor); // Should return new processor
  expect(result.buffer).toBe(processor.buffer); // Buffer should be same
  expect(result.config).toBe(processor.config); // Config should be same
});

it("Operations - should apply multiple operations in sequence", async () => {
  const validPngData = await getTestImage();
  const processor = await createImageProcessor(validPngData);

  const result = await pipe(
    resize({
      width: 50,
      height: 50,
      background: [0, 0, 0, 0],
      fit: "contain",
      position: "center",
    }),
    rotate(90, [255, 255, 255, 255]),
    flip("horizontal"),
  )(processor);

  expect(result).not.toBe(processor);
  expect(result.bitmap).toBeDefined();
});

it("Operations - should compose operations correctly", async () => {
  const validPngData = await getTestImage();
  const processor = await createImageProcessor(validPngData);

  const transform = compose(
    flip("vertical"),
    rotate(45, [0, 0, 0, 0]),
    resize({
      width: 75,
      height: 75,
      background: [0, 0, 0, 0],
      fit: "contain",
      position: "center",
    }),
  );

  const result = await transform(processor);
  expect(result).not.toBe(processor);
});

it("Operations - should handle operations on processors without bitmaps", async () => {
  const processor = await createImageProcessor(new Uint8Array([1, 2, 3]));
  expect(processor.bitmap).toBeNull();

  const resized = await resize({
    width: 100,
    height: 100,
    background: [0, 0, 0, 0],
    fit: "contain",
    position: "center",
  })(processor);
  expect(resized.bitmap).toBeNull(); // Should remain null
  expect(resized).toEqual(processor); // Should be unchanged
});

it("Pipeline system - should create and execute complex pipelines", async () => {
  let pipeline = createPipeline({ encoder: "image/png", quality: 90 });
  pipeline = addResize(pipeline, {
    width: 200,
    height: 200,
    background: [0, 0, 0, 0],
    fit: "contain",
    position: "center",
  });
  pipeline = addRotate(pipeline, 180, [255, 255, 255, 255]);
  pipeline = addFlip(pipeline, "horizontal");
  pipeline = addCrop(pipeline, {
    x: 10,
    y: 10,
    width: 50,
    height: 50,
    background: [0, 0, 0, 0],
  });

  expect(pipeline.operations).toHaveLength(4);
  expect(pipeline.config.encoder).toBe("image/png");
  expect(pipeline.config.quality).toBe(90);
});

it("Pipeline system - should reuse pipelines with different inputs", async () => {
  const pipeline = createThumbnailPipeline(64);
  const input1 = new Uint8Array([1]);
  const input2 = new Uint8Array([2]);

  const result1 = await processPipeline(pipeline, input1, {
    format: "image/jpeg",
  });
  const result2 = await processPipeline(pipeline, input2, {
    format: "image/jpeg",
  });

  expect(result1).toBeInstanceOf(Uint8Array);
  expect(result2).toBeInstanceOf(Uint8Array);
  expect(result1).not.toBe(result2);
});

it("Pipeline system - should create pipelines from templates", async () => {
  const template: PipelineTemplate = {
    name: "social-media",
    operations: [
      {
        type: "resize",
        params: {
          width: 1080,
          height: 1080,
          fit: "cover",
          background: [0, 0, 0, 0],
          position: "center",
        },
      },
      { type: "rotate", params: { angle: 0, color: [255, 255, 255, 255] } },
    ],
    outputFormat: "image/jpeg",
  };

  const pipeline = createPipelineFromTemplate(template);
  expect(pipeline.operations).toHaveLength(2);
  expect(pipeline.config.encoder).toBe("image/jpeg");
});

it("Configuration and strategies - should apply different processing strategies", async () => {
  const speedPipeline = createSpeedOptimizedPipeline();
  const qualityPipeline = createQualityOptimizedPipeline();
  const sizePipeline = createSizeOptimizedPipeline();

  expect(speedPipeline.config.encoder).toBe("image/jpeg");
  expect(speedPipeline.config.quality).toBe(70);

  expect(qualityPipeline.config.encoder).toBe("image/png");
  expect(qualityPipeline.config.preserveMetadata).toBe(true);

  expect(sizePipeline.config.encoder).toBe("image/webp");
  expect(sizePipeline.config.quality).toBe(60);
});

it("Configuration and strategies - should override config with custom options", async () => {
  const customPipeline = createSpeedOptimizedPipeline({ quality: 85 });
  expect(customPipeline.config.quality).toBe(85);
  expect(customPipeline.config.encoder).toBe("image/jpeg");
});

it("Configuration and strategies - should create processors with custom configs", async () => {
  const config: ProcessingConfig = {
    decoder: "image/png",
    encoder: "image/webp",
    quality: 75,
    preserveMetadata: true,
  };

  const processor = await createImageProcessor(new Uint8Array([0]), config);
  expect(processor.config).toEqual(config);
});

it("Immutability - should not mutate original processor during operations", async () => {
  const originalProcessor = await createImageProcessor(
    new Uint8Array([1, 2, 3]),
  );
  const originalBuffer = originalProcessor.buffer;
  const originalConfig = originalProcessor.config;

  const newProcessor = await resize({
    width: 100,
    height: 100,
    background: [0, 0, 0, 0],
    fit: "contain",
    position: "center",
  })(originalProcessor);

  expect(originalProcessor.buffer).toBe(originalBuffer);
  expect(originalProcessor.config).toBe(originalConfig);
  expect(newProcessor).not.toBe(originalProcessor);
});

it("Immutability - should not mutate pipeline during operation addition", () => {
  const originalPipeline = createPipeline();
  const originalOperations = originalPipeline.operations;

  const newPipeline = addResize(originalPipeline, {
    width: 100,
    height: 100,
    background: [0, 0, 0, 0],
    fit: "contain",
    position: "center",
  });

  expect(originalPipeline.operations).toBe(originalOperations);
  expect(originalPipeline.operations).toHaveLength(0);
  expect(newPipeline.operations).toHaveLength(1);
  expect(newPipeline).not.toBe(originalPipeline);
});

it("Error handling - should handle encoding errors gracefully", async () => {
  const processor = await createImageProcessor(new Uint8Array([0]));
  // This should not throw but return the original buffer
  const result = await toBuffer(processor, { format: "image/png" });
  expect(result).toBeInstanceOf(Uint8Array);
});

it("Error handling - should propagate errors in pipeline processing", async () => {
  const invalidPipeline = createPipeline();
  await expect(
    processPipeline(invalidPipeline, "invalid://url", {
      format: "image/png",
    }),
  ).rejects.toThrow();
});

it("Error handling - should handle invalid operation parameters", async () => {
  const processor = await createImageProcessor(new Uint8Array([0]));

  // Invalid resize parameters should not crash
  const invalidResize = resize({
    width: -100,
    height: -100,
    background: [0, 0, 0, 0],
    fit: "contain",
    position: "center",
  });
  const result = await invalidResize(processor);
  expect(result).toBeDefined();
});

it("Functional builder advanced - should support complex transformation chains", async () => {
  const builder = createFunctionalBuilder({
    encoder: "image/webp",
    quality: 80,
  });

  const chainedBuilder = builder
    .resize({
      width: 400,
      height: 300,
      background: [0, 0, 0, 0],
      fit: "contain",
      position: "center",
    })
    .rotate(45, [128, 128, 128, 255])
    .flip("vertical")
    .crop({
      x: 50,
      y: 50,
      width: 200,
      height: 200,
      background: [255, 255, 255, 255],
    });

  expect(typeof chainedBuilder.toBuffer).toBe("function");
  expect(typeof chainedBuilder.resize).toBe("function");
});

it("Functional builder advanced - should maintain builder state across operations", async () => {
  const builder = createFunctionalBuilder({ quality: 95 });

  const step1 = builder.resize({
    width: 100,
    height: 100,
    background: [0, 0, 0, 0],
    fit: "contain",
    position: "center",
  });
  const step2 = step1.rotate(90, [0, 0, 0, 0]);
  const step3 = step2.flip("horizontal");

  // Each step should return a new builder
  expect(step1).not.toBe(builder);
  expect(step2).not.toBe(step1);
  expect(step3).not.toBe(step2);
});

it("Performance and edge cases - should handle empty input gracefully", async () => {
  const emptyBuffer = new Uint8Array(0);
  const processor = await createImageProcessor(emptyBuffer);
  expect(processor.bitmap).toBeNull();
  expect(processor.buffer).toEqual(emptyBuffer);
});

it("Performance and edge cases - should handle very small images", async () => {
  const tinyPng = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);

  const processor = await createImageProcessor(tinyPng);
  expect(processor.bitmap).not.toBeNull();
  expect(processor.bitmap!.width).toBe(1);
  expect(processor.bitmap!.height).toBe(1);

  // Should handle operations on tiny images
  const resized = await resize({
    width: 10,
    height: 10,
    background: [0, 0, 0, 0],
    fit: "contain",
    position: "center",
  })(processor);
  expect(resized.bitmap).toBeDefined();
});

it("Performance and edge cases - should work with concurrent operations", async () => {
  const processor = await createImageProcessor(new Uint8Array([0]));

  const operations = [
    resize({
      width: 100,
      height: 100,
      background: [0, 0, 0, 0],
      fit: "contain",
      position: "center",
    })(processor),
    rotate(90, [255, 255, 255, 255])(processor),
    flip("horizontal")(processor),
    crop({ x: 0, y: 0, width: 50, height: 50, background: [0, 0, 0, 0] })(
      processor,
    ),
  ];

  const results = await Promise.all(operations);
  expect(results).toHaveLength(4);
  for (const result of results) {
    expect(result).toBeDefined();
    expect(result).not.toBe(processor);
  }
});

it("Operations - should actually resize image dimensions", async () => {
  const validPngData = await getTestImage();
  const processor = await createImageProcessor(validPngData);

  // Only test if bitmap exists and has valid dimensions
  if (!processor.bitmap) {
    expect(processor.bitmap).not.toBeNull();
    return;
  }

  const originalWidth = processor.bitmap.width;
  const originalHeight = processor.bitmap.height;

  // Resize to specific dimensions
  const targetWidth = 50;
  const targetHeight = 30;
  const resized = await resize({
    width: targetWidth,
    height: targetHeight,
    fit: "fill", // Force exact dimensions
    background: [0, 0, 0, 0],
    position: "center",
  })(processor);

  expect(resized.bitmap).not.toBeNull();
  expect(resized.bitmap!.width).toBe(targetWidth);
  expect(resized.bitmap!.height).toBe(targetHeight);
  expect(resized.bitmap!.width).not.toBe(originalWidth);
  expect(resized.bitmap!.height).not.toBe(originalHeight);
});

it("Operations - should actually modify pixel data", async () => {
  const validPngData = await getTestImage();
  const processor = await createImageProcessor(validPngData);

  // Only test if bitmap exists and has valid dimensions
  if (!processor.bitmap) {
    expect(processor.bitmap).not.toBeNull();
    return;
  }

  const originalPixelData = new Uint8ClampedArray(processor.bitmap.data);

  // Apply an operation that should change pixels (e.g., rotation, flip)
  const flipped = await flip("horizontal")(processor);

  expect(flipped.bitmap).not.toBeNull();

  // Pixel data should be different after transformation
  expect(flipped.bitmap!.data).not.toEqual(originalPixelData);

  // But should have same dimensions for horizontal flip
  expect(flipped.bitmap!.width).toBe(processor.bitmap.width);
  expect(flipped.bitmap!.height).toBe(processor.bitmap.height);
});

it("Operations - should flip image horizontally correctly", async () => {
  // Create a simple test image with known pixel pattern
  const pixelData = new Uint8ClampedArray(3 * 2 * 4); // 3x2 image, 4 bytes per pixel
  const testImageData = new ImageData(pixelData, 3, 2); // 3x2 image

  // Set left column to red, right column to blue
  for (let y = 0; y < 2; y++) {
    // Left pixel (red)
    testImageData.data[(y * 3 + 0) * 4] = 255; // R
    testImageData.data[(y * 3 + 0) * 4 + 1] = 0; // G
    testImageData.data[(y * 3 + 0) * 4 + 2] = 0; // B
    testImageData.data[(y * 3 + 0) * 4 + 3] = 255; // A

    // Right pixel (blue)
    testImageData.data[(y * 3 + 2) * 4] = 0; // R
    testImageData.data[(y * 3 + 2) * 4 + 1] = 0; // G
    testImageData.data[(y * 3 + 2) * 4 + 2] = 255; // B
    testImageData.data[(y * 3 + 2) * 4 + 3] = 255; // A
  }

  const processor = {
    bitmap: testImageData,
    buffer: new Uint8Array(),
    config: {},
  };
  const flipped = await flip("horizontal")(processor);

  // After horizontal flip, left should be blue, right should be red
  expect(flipped.bitmap!.data[0]).toBe(0); // Left pixel R (was blue)
  expect(flipped.bitmap!.data[2]).toBe(255); // Left pixel B (was blue)
  expect(flipped.bitmap!.data[8]).toBe(255); // Right pixel R (was red)
  expect(flipped.bitmap!.data[10]).toBe(0); // Right pixel B (was red)
});

it("Operations - should crop image correctly", async () => {
  const validPngData = await getTestImage();
  const processor = await createImageProcessor(validPngData);

  // Only test if bitmap exists and has valid dimensions
  if (!processor.bitmap) {
    expect(processor.bitmap).not.toBeNull();
    return;
  }

  const originalWidth = processor.bitmap.width;
  const originalHeight = processor.bitmap.height;

  const cropWidth = Math.floor(originalWidth / 2);
  const cropHeight = Math.floor(originalHeight / 2);

  const cropped = await crop({
    x: 0,
    y: 0,
    width: cropWidth,
    height: cropHeight,
    background: [0, 0, 0, 0],
  })(processor);

  expect(cropped.bitmap).not.toBeNull();
  expect(cropped.bitmap!.width).toBe(cropWidth);
  expect(cropped.bitmap!.height).toBe(cropHeight);

  // Cropped image should have fewer total pixels
  const originalPixelCount = originalWidth * originalHeight;
  const croppedPixelCount = cropWidth * cropHeight;
  expect(croppedPixelCount).toBeLessThan(originalPixelCount);
});

it("Operations - should rotate image 90 degrees correctly", async () => {
  const validPngData = await getTestImage();
  const processor = await createImageProcessor(validPngData);

  // Only test if bitmap exists and has valid dimensions
  if (!processor.bitmap) {
    expect(processor.bitmap).not.toBeNull();
    return;
  }

  const originalWidth = processor.bitmap.width;
  const originalHeight = processor.bitmap.height;

  const rotated = await rotate(90, [255, 255, 255, 255])(processor);

  expect(rotated.bitmap).not.toBeNull();

  // For 90-degree rotation, dimensions should swap
  expect(rotated.bitmap!.width).toBe(originalHeight);
  expect(rotated.bitmap!.height).toBe(originalWidth);

  // Pixel data should be different
  expect(rotated.bitmap!.data).not.toEqual(processor.bitmap!.data);
});

it("Operations - should produce consistent results for identical operations", async () => {
  const validPngData = await getTestImage();

  // Apply the same transformation twice
  const processor1 = await createImageProcessor(validPngData);
  const result1 = await resize({
    width: 100,
    height: 100,
    fit: "fill",
    background: [0, 0, 0, 0],
    position: "center",
  })(processor1);

  const processor2 = await createImageProcessor(validPngData);
  const result2 = await resize({
    width: 100,
    height: 100,
    fit: "fill",
    background: [0, 0, 0, 0],
    position: "center",
  })(processor2);

  // Results should be identical
  expect(result1.bitmap!.width).toBe(result2.bitmap!.width);
  expect(result1.bitmap!.height).toBe(result2.bitmap!.height);
  expect(result1.bitmap!.data).toEqual(result2.bitmap!.data);
});

it("Operations - should handle resize with different fit modes", async () => {
  const validPngData = await getTestImage();
  const processor = await createImageProcessor(validPngData);

  // Only test if bitmap exists and has valid dimensions
  if (!processor.bitmap) {
    expect(processor.bitmap).not.toBeNull();
    return;
  }

  // Test contain fit (should maintain aspect ratio)
  const contained = await resize({
    width: 100,
    height: 50,
    fit: "contain",
    background: [0, 0, 0, 0],
    position: "center",
  })(processor);

  expect(contained.bitmap).not.toBeNull();

  // Should not exceed target dimensions
  expect(contained.bitmap!.width).toBeLessThanOrEqual(100);
  expect(contained.bitmap!.height).toBeLessThanOrEqual(50);

  // Test fill fit (should use exact dimensions)
  const filled = await resize({
    width: 100,
    height: 50,
    fit: "fill",
    background: [0, 0, 0, 0],
    position: "center",
  })(processor);

  expect(filled.bitmap).not.toBeNull();
  expect(filled.bitmap!.width).toBe(100);
  expect(filled.bitmap!.height).toBe(50);
});

it("Operations - should verify flip vertical changes pixel arrangement", async () => {
  const validPngData = await getTestImage();
  const processor = await createImageProcessor(validPngData);

  // Only test if bitmap exists and has valid dimensions
  if (!processor.bitmap) {
    expect(processor.bitmap).not.toBeNull();
    return;
  }

  const originalData = new Uint8ClampedArray(processor.bitmap.data);

  const flipped = await flip("vertical")(processor);

  expect(flipped.bitmap).not.toBeNull();

  // Dimensions should remain the same
  expect(flipped.bitmap!.width).toBe(processor.bitmap.width);
  expect(flipped.bitmap!.height).toBe(processor.bitmap.height);

  // But pixel data should be different (unless it's a perfectly symmetric image)
  expect(flipped.bitmap!.data).not.toEqual(originalData);
});

it("Operations - should handle complex transformation chains with verifiable results", async () => {
  const validPngData = await getTestImage();
  const processor = await createImageProcessor(validPngData);

  // Only test if bitmap exists and has valid dimensions
  if (!processor.bitmap) {
    expect(processor.bitmap).not.toBeNull();
    return;
  }

  const originalWidth = processor.bitmap.width;
  const originalHeight = processor.bitmap.height;

  // Apply multiple transformations
  const result = await pipe(
    resize({
      width: 200,
      height: 200,
      fit: "fill",
      background: [0, 0, 0, 0],
      position: "center",
    }),
    crop({ x: 50, y: 50, width: 100, height: 100, background: [0, 0, 0, 0] }),
    flip("horizontal"),
  )(processor);

  expect(result.bitmap).not.toBeNull();

  // Final image should be 100x100 (after crop)
  expect(result.bitmap!.width).toBe(100);
  expect(result.bitmap!.height).toBe(100);

  // Should be smaller than original
  expect(result.bitmap!.width).toBeLessThanOrEqual(originalWidth);
  expect(result.bitmap!.height).toBeLessThanOrEqual(originalHeight);

  // Pixel data should be completely different
  expect(result.bitmap!.data).not.toEqual(processor.bitmap.data);
});
