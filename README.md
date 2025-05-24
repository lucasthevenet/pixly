# Pixly

A modern, functional image processing library for JavaScript and TypeScript that provides a clean, composable API for image transformations.

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
import { createImageProcessor, resize, toBuffer } from 'pixly';

// Load and process an image
const processor = await createImageProcessor('path/to/image.jpg');
const resized = await resize({ width: 300, height: 200 })(processor);
const buffer = await toBuffer(resized, { format: 'image/png' });
```

## Core Concepts

### Image Processors

Image processors are the core building blocks that hold image data and configuration:

```typescript
import { createImageProcessor } from 'pixly';

// From URL
const processor = await createImageProcessor('https://example.com/image.jpg');

// From File (browser)
const processor = await createImageProcessor(file);

// From Buffer
const processor = await createImageProcessor(buffer);

// From Blob
const processor = await createImageProcessor(blob);
```

## Functional Transformations

Pixly provides functional transformation functions that can be composed:

### Resize

```typescript
import { resize } from 'pixly';

const resized = await resize({
  width: 800,
  height: 600,
  fit: 'cover', // 'cover', 'contain', 'fill', 'inside', 'outside'
  position: 'center', // 'center', 'top', 'bottom', 'left', 'right'
  background: [255, 255, 255, 0] // RGBA background color
})(processor);
```

### Rotate

```typescript
import { rotate } from 'pixly';

const rotated = await rotate(90, [255, 255, 255, 255])(processor);
```

### Flip

```typescript
import { flip } from 'pixly';

const flipped = await flip('horizontal')(processor); // 'horizontal' or 'vertical'
```

### Crop

```typescript
import { crop } from 'pixly';

const cropped = await crop({
  x: 100,
  y: 100,
  width: 400,
  height: 300
})(processor);
```

## Function Composition

Combine multiple transformations using `pipe` or `compose`:

```typescript
import { pipe, compose, resize, rotate, flip, toBuffer } from 'pixly';

// Using pipe (left to right)
const transformed = await pipe(
  resize({ width: 400, height: 400 }),
  rotate(45, [255, 255, 255, 255]),
  flip('horizontal')
)(processor);

// Using compose (right to left)
const transformed2 = await compose(
  flip('horizontal'),
  rotate(45, [255, 255, 255, 255]),
  resize({ width: 400, height: 400 })
)(processor);
```

## Pipeline System

For more complex workflows, use the pipeline system:

```typescript
import {
  createPipeline,
  addResize,
  addRotate,
  addFlip,
  processPipeline
} from 'pixly';

// Create a reusable pipeline
const pipeline = createPipeline({ quality: 90 });
const withResize = addResize(pipeline, { width: 800, height: 600 });
const withRotate = addRotate(withResize, 90, [255, 255, 255, 255]);
const withFlip = addFlip(withRotate, 'horizontal');

// Process multiple images with the same pipeline
const result1 = await processPipeline(withFlip, 'image1.jpg', { format: 'image/png' });
const result2 = await processPipeline(withFlip, 'image2.jpg', { format: 'image/png' });
```

## Preset Pipelines

Pixly includes common preset pipelines:

```typescript
import {
  createThumbnailPipeline,
  createWebOptimizedPipeline,
  createCompressionPipeline,
  processPipelineToBlob
} from 'pixly';

// Create thumbnail
const thumbPipeline = createThumbnailPipeline(150, { quality: 80 });
const thumbnail = await processPipelineToBlob(thumbPipeline, input);

// Web optimization
const webPipeline = createWebOptimizedPipeline(1920, { quality: 85 });
const webImage = await processPipelineToBlob(webPipeline, input);

// Compression
const compressPipeline = createCompressionPipeline(60);
const compressed = await processPipelineToBlob(compressPipeline, input);
```

## Functional Builder

For a fluent API experience:

```typescript
import { createFunctionalBuilder } from 'pixly';

const builder = createFunctionalBuilder({ quality: 90 });

// Chain operations
const result = await builder
  .resize({ width: 800, height: 600 })
  .rotate(45, [255, 255, 255, 255])
  .flip('horizontal')
  .toBuffer(input, { format: 'image/png' });

// Or get different outputs
const blob = await builder
  .resize({ width: 400, height: 400 })
  .toBlob(input, { format: 'image/jpeg' });

const dataUrl = await builder
  .resize({ width: 200, height: 200 })
  .toDataURL(input, { format: 'image/webp' });
```

## Output Formats

Convert processed images to different formats:

```typescript
import { toBuffer, toBlob, toDataURL } from 'pixly';

// To buffer
const buffer = await toBuffer(processor, { format: 'image/png' });

// To blob
const blob = await toBlob(processor, { format: 'image/jpeg', quality: 80 });

// To data URL
const dataUrl = await toDataURL(processor, { format: 'image/webp' });
```

## Supported Formats

- **PNG**: `image/png`
- **JPEG**: `image/jpeg`
- **WebP**: `image/webp`
- **AVIF**: `image/avif`
- **QOI**: `image/qoi`
- **JPEG XL**: `image/jxl`

## Configuration Options

### Processing Config

```typescript
interface ProcessingConfig {
  decoder?: "auto" | MimeType; // Auto-detect or force specific decoder
  encoder?: MimeType;          // Output format
  quality?: number;            // 0-100 for lossy formats
  preserveMetadata?: boolean;  // Keep image metadata
}
```

### Output Options

```typescript
interface OutputOptions {
  format: MimeType;     // Required output format
  quality?: number;     // 0-100 for lossy formats
  width?: number;       // Override width
  height?: number;      // Override height
}
```

## Error Handling

Pixly gracefully handles errors and provides fallbacks:

```typescript
try {
  const processor = await createImageProcessor('invalid-image.jpg');
  // processor.bitmap will be null for invalid images
  if (!processor.bitmap) {
    console.log('Failed to decode image');
  }
} catch (error) {
  console.error('Error processing image:', error);
}
```

## TypeScript Support

Pixly is written in TypeScript and provides full type safety:

```typescript
import type {
  ImageProcessor,
  Pipeline,
  OutputOptions,
  ProcessingConfig,
  ResizeOptions,
  CropOptions
} from 'pixly';
```

## Browser and Node.js Support

Pixly works in both browser and Node.js environments. The library automatically handles different input types and provides appropriate APIs for each environment.

## Performance Tips

1. **Reuse Pipelines**: Create pipelines once and reuse them for multiple images
2. **Batch Processing**: Use pipelines for consistent transformations across multiple images
3. **Format Selection**: Choose appropriate output formats (WebP for web, JPEG for photos, PNG for graphics)
4. **Quality Settings**: Balance file size and quality based on your use case

## Examples

### Creating Image Thumbnails

```typescript
import { createThumbnailPipeline, processPipelineToBlob } from 'pixly';

const pipeline = createThumbnailPipeline(200, {
  quality: 85,
  fit: 'cover'
});

const thumbnails = await Promise.all(
  imageFiles.map(file => processPipelineToBlob(pipeline, file))
);
```

### Batch Image Optimization

```typescript
import { createWebOptimizedPipeline, processPipeline } from 'pixly';

const pipeline = createWebOptimizedPipeline(1200, { quality: 80 });

const optimizedImages = await Promise.all(
  images.map(async (image) => {
    const buffer = await processPipeline(pipeline, image, {
      format: 'image/webp'
    });
    return new Blob([buffer], { type: 'image/webp' });
  })
);
```

### Complex Image Processing

```typescript
import {
  createImageProcessor,
  pipe,
  resize,
  rotate,
  crop,
  toDataURL
} from 'pixly';

const processor = await createImageProcessor(imageFile);

const result = await pipe(
  crop({ x: 100, y: 100, width: 800, height: 600 }),
  resize({ width: 400, height: 300, fit: 'cover' }),
  rotate(15, [255, 255, 255, 255])
)(processor);

const dataUrl = await toDataURL(result, { format: 'image/png' });
```

## License

MIT
