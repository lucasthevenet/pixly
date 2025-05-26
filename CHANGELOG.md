# pixly

## 1.0.0

### Major Changes

- f05ee31: # Complete API Redesign: New Composable Builder Pattern

  This release introduces a completely redesigned API that replaces the functional approach with a more intuitive, type-safe, and composable builder pattern.

  ## Breaking Changes

  The entire API has been redesigned. All previous exports and patterns have been replaced.

  ### Previous API (v0.x)

  ```typescript
  import { createImageProcessor, resize, rotate, toBuffer, pipe } from "pixly";

  // Create processor first
  const processor = await createImageProcessor("image.jpg");

  // Apply transformations
  const resized = await resize({ width: 800, height: 600 })(processor);
  const rotated = await rotate(90, [255, 255, 255, 255])(resized);

  // Or use pipe
  const result = await pipe(
    resize({ width: 800, height: 600 }),
    rotate(90, [255, 255, 255, 255])
  )(processor);

  // Convert to output
  const buffer = await toBuffer(result, { format: "image/png" });
  ```

  ### New API (v1.0)

  ```typescript
  import { px } from "pixly";

  // Single chain with builder pattern
  const result = await px
    .decoder(px.auto())
    .encoder(px.png.encode())
    .apply(px.resize({ width: 800, height: 600 }))
    .apply(px.rotate(90))
    .process("image.jpg");

  // Get output
  const buffer = result.toBuffer();
  ```

  ## Major Changes

  ### 1. Namespace Import

  All functionality is now accessed through the `px` namespace:

  ```typescript
  import { px } from "pixly";
  ```

  ### 2. Builder Pattern

  Operations are chained using a type-safe builder pattern instead of functional composition:

  ```typescript
  // Before: Function composition
  const result = await pipe(operation1, operation2)(processor);

  // After: Builder chain
  const result = await px
    .decoder(codec.decode())
    .encoder(codec.encode())
    .apply(operation1)
    .apply(operation2)
    .process(input);
  ```

  ### 3. Unified Codec API

  Decoders and encoders are now accessed through codec objects:

  ```typescript
  // Before
  import { createImageProcessor } from "pixly";
  const processor = await createImageProcessor(input); // Auto-detection built-in

  // After
  px.decoder(px.jpeg.decode()); // Explicit decoder
  px.encoder(px.webp.encode({ quality: 0.8 })); // Explicit encoder with options
  ```

  ### 4. Type-Safe Requirements

  The new API uses TypeScript to enforce correct usage:

  - `decoder()` and `encoder()` must be called before `process()`
  - Each can only be called once
  - `preset()` can only be called when no decoder/encoder is set

  ### 5. Simplified Input Handling

  Input is now provided to `process()` instead of creating a processor:

  ```typescript
  // Before
  const processor = await createImageProcessor(input);

  // After
  const result = await px
    .decoder(px.auto())
    .encoder(px.jpeg.encode())
    .process(input); // Input goes here
  ```

  ### 6. New Output API

  Results now have methods for different output formats:

  ```typescript
  // Before
  const buffer = await toBuffer(processor, { format: "image/png" });
  const blob = await toBlob(processor, { format: "image/jpeg" });
  const dataUrl = await toDataURL(processor, { format: "image/webp" });

  // After
  const result = await px
    .decoder(px.auto())
    .encoder(px.png.encode())
    .process(input);

  const buffer = result.toBuffer();
  const blob = result.toBlob();
  const dataUrl = result.toDataURL();
  ```

  ## Removed Features

  - `createImageProcessor` - Input is now passed to `process()`
  - `pipe` and `compose` - Use `.apply()` chaining instead
  - Pipeline system (`createPipeline`, `addResize`, etc.) - Use presets instead
  - Functional builder (`createFunctionalBuilder`) - Use the new builder pattern
  - Preset pipelines (`createThumbnailPipeline`, etc.) - Create custom presets

  ## New Features

  ### Presets

  Create reusable operation chains:

  ```typescript
  const thumbnailPreset = px
    .apply(px.resize({ width: 150, height: 150, fit: "cover" }))
    .apply(px.sharpen(1.2))
    .preset();

  // Use in multiple places
  const result = await px
    .decoder(px.auto())
    .encoder(px.webp.encode({ quality: 80 }))
    .apply(thumbnailPreset)
    .process(input);
  ```

  ### Direct API Access

  No need to call a function to start:

  ```typescript
  // Before
  const processor = await createImageProcessor(input);

  // After - start directly with px
  await px.decoder(px.auto())...
  ```

  ## Migration Guide

  ### Basic Image Processing

  ```typescript
  // Before
  const processor = await createImageProcessor("image.jpg");
  const resized = await resize({ width: 800 })(processor);
  const buffer = await toBuffer(resized, { format: "image/webp" });

  // After
  const result = await px
    .decoder(px.auto())
    .encoder(px.webp.encode())
    .apply(px.resize({ width: 800 }))
    .process("image.jpg");
  const buffer = result.toBuffer();
  ```

  ### Multiple Operations

  ```typescript
  // Before
  const result = await pipe(
    resize({ width: 800, height: 600 }),
    rotate(45, [255, 255, 255, 255]),
    flip("horizontal")
  )(processor);

  // After
  const result = await px
    .decoder(px.auto())
    .encoder(px.jpeg.encode())
    .apply(px.resize({ width: 800, height: 600 }))
    .apply(px.rotate(45))
    .apply(px.flip("horizontal"))
    .process(input);
  ```

  ### Format Conversion

  ```typescript
  // Before
  const processor = await createImageProcessor(pngBuffer);
  const jpegBuffer = await toBuffer(processor, {
    format: "image/jpeg",
    quality: 90,
  });

  // After
  const result = await px
    .decoder(px.png.decode())
    .encoder(px.jpeg.encode({ quality: 90 }))
    .process(pngBuffer);
  const jpegBuffer = result.toBuffer();
  ```

  ### Reusable Pipelines

  ```typescript
  // Before
  const pipeline = createPipeline({ quality: 90 });
  const withResize = addResize(pipeline, { width: 800 });
  const withRotate = addRotate(withResize, 90);

  // After
  const myPreset = px
    .apply(px.resize({ width: 800 }))
    .apply(px.rotate(90))
    .preset();

  // Use with any encoder/decoder combination
  const result = await px
    .decoder(px.auto())
    .encoder(px.jpeg.encode({ quality: 90 }))
    .apply(myPreset)
    .process(input);
  ```

  ## Updated Operation Names

  Most operations keep their names but are now accessed through `px`:

  - `resize` → `px.resize`
  - `rotate` → `px.rotate`
  - `flip` → `px.flip`
  - `crop` → `px.crop`

  The main difference is that rotation no longer requires a background color parameter in the basic usage.

  ## Benefits of the New API

  1. **Better IntelliSense**: The `px` namespace provides excellent autocomplete
  2. **Type Safety**: TypeScript prevents common mistakes at compile time
  3. **Cleaner Code**: No need for intermediate processor objects
  4. **Flexible I/O**: Separate decoder/encoder selection allows any format conversion
  5. **Composable**: Presets make it easy to create and share operation chains

## 0.1.1

### Patch Changes

- b76f87b: Prevent duplicate WASM initializations/compilations

## 0.1.0

### Minor Changes

- b1b2f42: Initial release
