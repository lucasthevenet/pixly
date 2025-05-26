# Pixly

A modern, composable image processing library for JavaScript and TypeScript that provides a type-safe builder API for image transformations.

## Installation

```bash
npm install pixly
# or
yarn add pixly
# or
bun add pixly
```

## Quick Start

```typescript
import { px } from 'pixly';

// Process an image with auto-detection
const result = await px.decoder(px.auto())
  .encoder(px.webp.encode({ quality: 80 }))
  .apply(px.resize({ width: 800 }))
  .process('path/to/image.jpg');

// Get the result as different formats
const buffer = result.toBuffer();
const blob = result.toBlob();
const dataUrl = result.toDataURL();
```

## Core Concepts

### Builder Pattern

Pixly uses a fluent builder pattern that guides you through the image processing pipeline:

1. Set a decoder (to read the input format)
2. Set an encoder (to write the output format)
3. Apply transformations
4. Process the input

```typescript
const result = await px.decoder(px.jpeg.decode())     // 1. Decode JPEG
  .encoder(px.png.encode())                           // 2. Encode to PNG
  .apply(px.resize({ width: 500 }))                   // 3. Add operations
  .apply(px.rotate(90))                                // 3. Chain more operations
  .process(imageInput);                                // 4. Process
```

### Type Safety

The API uses TypeScript to ensure correct usage:
- `decoder()` and `encoder()` must be called before `process()`
- Each can only be called once
- Operations are type-checked

## Input Types

Pixly accepts various input types:

```typescript
// From URL
const result = await px.decoder(px.auto())
  .encoder(px.webp.encode())
  .process('https://example.com/image.jpg');

// From File (browser)
const result = await px.decoder(px.auto())
  .encoder(px.webp.encode())
  .process(fileInput.files[0]);

// From Buffer/ArrayBuffer
const result = await px.decoder(px.auto())
  .encoder(px.webp.encode())
  .process(arrayBuffer);

// From Blob
const result = await px.decoder(px.auto())
  .encoder(px.webp.encode())
  .process(blob);
```

## Codecs

### Available Codecs

Each codec provides both `decode()` and `encode()` methods:

- **PNG**: `px.png`
- **JPEG**: `px.jpeg`
- **WebP**: `px.webp`
- **AVIF**: `px.avif`
- **JPEG XL**: `px.jxl`
- **QOI**: `px.qoi`
- **Auto**: `px.auto` (decode only - auto-detects format)

### Format Conversion

```typescript
// Convert PNG to JPEG
const result = await px.decoder(px.png.decode())
  .encoder(px.jpeg.encode({ quality: 90 }))
  .process(pngImage);

// Convert any format to WebP
const result = await px.decoder(px.auto())
  .encoder(px.webp.encode({ quality: 85, lossless: false }))
  .process(inputImage);
```

### Encoder Options

Different codecs support different encoding options:

```typescript
// JPEG options
px.jpeg.encode({ quality: 90 });

// WebP options
px.webp.encode({ quality: 85, lossless: false });

// PNG options
px.png.encode({ compressionLevel: 6 });
```

## Operations

All operations are applied using the `apply()` method:

### Resize

```typescript
const result = await px.decoder(px.auto())
  .encoder(px.webp.encode())
  .apply(px.resize({
    width: 800,
    height: 600,
    fit: 'cover',        // 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
    position: 'center',  // Position when cropping
    background: [255, 255, 255, 0] // RGBA background color
  }))
  .process(input);
```

### Rotate

```typescript
const result = await px.decoder(px.auto())
  .encoder(px.jpeg.encode())
  .apply(px.rotate(90))  // Rotate 90 degrees clockwise
  .process(input);
```

### Flip

```typescript
const result = await px.decoder(px.auto())
  .encoder(px.png.encode())
  .apply(px.flip('horizontal'))  // 'horizontal' or 'vertical'
  .process(input);
```

### Crop

```typescript
const result = await px.decoder(px.auto())
  .encoder(px.webp.encode())
  .apply(px.crop({
    x: 100,
    y: 100,
    width: 400,
    height: 300
  }))
  .process(input);
```

### Blur

```typescript
const result = await px.decoder(px.auto())
  .encoder(px.jpeg.encode())
  .apply(px.blur(5))  // Blur radius
  .process(input);
```

### Sharpen

```typescript
const result = await px.decoder(px.auto())
  .encoder(px.jpeg.encode())
  .apply(px.sharpen(1.5))  // Sharpen amount
  .process(input);
```

### Brightness

```typescript
const result = await px.decoder(px.auto())
  .encoder(px.jpeg.encode())
  .apply(px.brightness(1.2))  // 1.0 = no change, >1 = brighter, <1 = darker
  .process(input);
```

## Chaining Operations

Operations can be chained to create complex transformations:

```typescript
const result = await px.decoder(px.auto())
  .encoder(px.webp.encode({ quality: 80 }))
  .apply(px.resize({ width: 1200, height: 800, fit: 'cover' }))
  .apply(px.rotate(45))
  .apply(px.brightness(1.1))
  .apply(px.sharpen(1.2))
  .apply(px.blur(0.5))
  .process(input);
```

## Presets

Create reusable operation chains:

```typescript
// Create a preset (without encoder/decoder)
const thumbnailPreset = px
  .apply(px.resize({ width: 150, height: 150, fit: 'cover' }))
  .apply(px.sharpen(1.2))
  .preset();

const instagramPreset = px
  .apply(px.resize({ width: 1080, height: 1080, fit: 'cover' }))
  .apply(px.brightness(1.05))
  .apply(px.sharpen(1.1))
  .preset();

// Use presets in different contexts
const thumbnail = await px.decoder(px.auto())
  .encoder(px.webp.encode({ quality: 80 }))
  .apply(thumbnailPreset)
  .process(input);

const instagramPost = await px.decoder(px.auto())
  .encoder(px.jpeg.encode({ quality: 90 }))
  .apply(instagramPreset)
  .process(input);
```

## Output Formats

The processing result provides multiple output methods:

```typescript
const result = await px.decoder(px.auto())
  .encoder(px.webp.encode())
  .apply(px.resize({ width: 800 }))
  .process(input);

// Get as Uint8Array buffer
const buffer = result.toBuffer();

// Get as Blob (useful in browsers)
const blob = result.toBlob();

// Get as data URL (base64 encoded)
const dataUrl = result.toDataURL();
```

## Error Handling

Pixly provides clear error messages for common issues:

```typescript
try {
  // This will throw - decoder and encoder required
  const result = await px
    .apply(px.resize({ width: 100 }))
    .process(input);
} catch (error) {
  console.error('Processing failed:', error.message);
}
```

## TypeScript Support

Pixly is written in TypeScript and provides full type safety:

```typescript
import type {
  ImageEditor,
  ProcessingResult,
  ResizeOptions,
  ImageInput
} from 'pixly';
```

## Examples

### Creating Multiple Sizes

```typescript
const sizes = [
  { width: 150, name: 'thumbnail' },
  { width: 800, name: 'medium' },
  { width: 1920, name: 'large' }
];

const results = await Promise.all(
  sizes.map(async ({ width, name }) => {
    const result = await px.decoder(px.auto())
      .encoder(px.webp.encode({ quality: 85 }))
      .apply(px.resize({ width }))
      .process(originalImage);

    return {
      name,
      blob: result.toBlob()
    };
  })
);
```

### Batch Processing with Preset

```typescript
// Create a web optimization preset
const webOptimized = px
  .apply(px.resize({ width: 1920, height: 1080, fit: 'inside' }))
  .apply(px.sharpen(1.1))
  .preset();

// Apply to multiple images
const processedImages = await Promise.all(
  imageFiles.map(file =>
    px.decoder(px.auto())
      .encoder(px.webp.encode({ quality: 85 }))
      .apply(webOptimized)
      .process(file)
  )
);
```

### Format Conversion Pipeline

```typescript
// Convert all images to modern formats
async function modernizeImage(input: ImageInput) {
  // Try AVIF first (best compression)
  try {
    return await px.decoder(px.auto())
      .encoder(px.avif.encode({ quality: 80 }))
      .process(input);
  } catch {
    // Fall back to WebP
    return await px.decoder(px.auto())
      .encoder(px.webp.encode({ quality: 85 }))
      .process(input);
  }
}
```

### Profile Picture Generator

```typescript
const profilePicturePreset = px
  .apply(px.resize({ width: 400, height: 400, fit: 'cover' }))
  .apply(px.sharpen(1.2))
  .preset();

async function generateProfilePicture(file: File) {
  const result = await px.decoder(px.auto())
    .encoder(px.jpeg.encode({ quality: 90 }))
    .apply(profilePicturePreset)
    .process(file);

  return result.toBlob();
}
```

## Browser and Node.js Support

Pixly works in both browser and Node.js environments, automatically handling environment-specific features.

## Performance Tips

1. **Reuse Presets**: Create presets once and reuse them for consistent transformations
2. **Choose Appropriate Formats**: Use WebP or AVIF for smaller file sizes, JPEG for photos, PNG for images with transparency
3. **Optimize Quality Settings**: Balance quality and file size based on your use case
4. **Process in Parallel**: Use `Promise.all()` for batch processing

## License

MIT
