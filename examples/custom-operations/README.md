# Custom Operations Examples

This directory contains examples demonstrating how to create and use custom image operations with Pixly's function-based operation system.

## Table of Contents

- [Basic Custom Operations](#basic-custom-operations)
- [Using Built-in Custom Operations](#using-built-in-custom-operations)
- [Advanced Operation Patterns](#advanced-operation-patterns)
- [Type Safety and Validation](#type-safety-and-validation)
- [Error Handling](#error-handling)
- [Performance Considerations](#performance-considerations)

## Basic Custom Operations

### Simple Custom Operation

The simplest way to create a custom operation is using a direct function:

```typescript
import { OperationFunction, applyOperation, createImageProcessor } from 'pixly';

// Simple invert operation
const invertColors: OperationFunction = async (bitmap) => {
  const newData = new Uint8ClampedArray(bitmap.data);
  
  for (let i = 0; i < newData.length; i += 4) {
    newData[i] = 255 - newData[i];       // Red
    newData[i + 1] = 255 - newData[i + 1]; // Green
    newData[i + 2] = 255 - newData[i + 2]; // Blue
    // Alpha channel (i + 3) remains unchanged
  }
  
  return new ImageData(newData, bitmap.width, bitmap.height);
};

// Usage
const processor = await createImageProcessor('./input.jpg');
const result = await applyOperation(processor, invertColors);
```

### Parameterized Custom Operation

For operations that need parameters, use the `createOperation` helper:

```typescript
import { createOperation, OperationFunction } from 'pixly';

// Custom brightness operation with parameter
const customBrightness = (amount: number): OperationFunction =>
  createOperation(
    async (bitmap, brightness: number) => {
      const newData = new Uint8ClampedArray(bitmap.data);
      
      for (let i = 0; i < newData.length; i += 4) {
        newData[i] = Math.min(255, Math.max(0, newData[i] + brightness));
        newData[i + 1] = Math.min(255, Math.max(0, newData[i + 1] + brightness));
        newData[i + 2] = Math.min(255, Math.max(0, newData[i + 2] + brightness));
      }
      
      return new ImageData(newData, bitmap.width, bitmap.height);
    },
    amount
  );

// Usage
const brightenBy50 = customBrightness(50);
const result = await applyOperation(processor, brightenBy50);
```

## Using Built-in Custom Operations

Pixly provides several ready-to-use custom operations:

### Color Adjustments

```typescript
import { 
  brightness, 
  contrast, 
  adjustChannels, 
  tint,
  grayscale,
  sepia,
  invert
} from 'pixly';

// Basic adjustments
const brighten = brightness(30);
const increaseContrast = contrast(0.2);

// Channel manipulation
const enhanceRed = adjustChannels({ red: 1.5, green: 1, blue: 1 });

// Color effects
const warmTint = tint({ red: 255, green: 200, blue: 150, opacity: 0.3 });
const makeGrayscale = grayscale({ method: 'luminance' });
const vintageSepia = sepia(0.7);
const invertImage = invert();
```

### Filters and Effects

```typescript
import { sharpen, pixelate, blur } from 'pixly';

// Sharpening
const sharpenImage = sharpen(1.2);

// Pixelation effect
const pixelArt = pixelate(4);

// Blur (built-in operation)
const softBlur = blur(3);
```

## Advanced Operation Patterns

### Composing Operations

```typescript
import { composeOperations, pipe } from 'pixly';

// Method 1: Using composeOperations
const vintageEffect = composeOperations(
  brightness(-10),
  contrast(0.1),
  sepia(0.6),
  tint({ red: 255, green: 240, blue: 200, opacity: 0.2 })
);

// Method 2: Using pipe utility
const photoEnhancement = pipe(
  adjustChannels({ red: 1.1, green: 1.05, blue: 0.95 }),
  brightness(5),
  contrast(0.15),
  sharpen(0.8)
);

// Usage
const processor = await createImageProcessor('./photo.jpg');
const vintage = await applyOperation(processor, vintageEffect);
const enhanced = await photoEnhancement(processor);
```

### Conditional Operations

```typescript
import { createConditionalOperation, grayscale, brightness } from 'pixly';

// Apply different operations based on image properties
const adaptiveEnhancement = createConditionalOperation(
  (bitmap) => bitmap.width * bitmap.height > 1000000, // Large images
  brightness(-5), // Darken large images slightly
  brightness(10)  // Brighten small images
);

// Apply grayscale only to landscape images
const landscapeGrayscale = createConditionalOperation(
  (bitmap) => bitmap.width > bitmap.height,
  grayscale({ method: 'luminance' })
  // No else operation - landscape images unchanged
);
```

### Safe Operations with Error Handling

```typescript
import { createSafeOperation, brightness } from 'pixly';

// Operation that falls back gracefully on error
const safeBrightness = createSafeOperation(
  async (bitmap) => {
    // Potentially risky operation
    if (bitmap.width === 0) throw new Error('Invalid image');
    return brightness(20)(bitmap);
  },
  async (bitmap, error) => {
    console.warn('Brightness failed, applying gentle enhancement:', error.message);
    return brightness(5)(bitmap); // Fallback to gentle brightness
  }
);

// Operation that returns original on any error
const conservativeSharpen = createSafeOperation(
  sharpen(2) // Might be too aggressive
  // No fallback - returns original image on error
);
```

## Type Safety and Validation

### Custom Operation with Type Safety

```typescript
import { createOperation, validateOperationParams } from 'pixly';

interface ColorBalanceOptions {
  redShift: number;
  greenShift: number;
  blueShift: number;
  preserveLuminance?: boolean;
}

const colorBalance = (options: ColorBalanceOptions): OperationFunction => {
  // Runtime validation
  validateOperationParams(
    options,
    (opts) => 
      opts.redShift >= -100 && opts.redShift <= 100 &&
      opts.greenShift >= -100 && opts.greenShift <= 100 &&
      opts.blueShift >= -100 && opts.blueShift <= 100,
    'Color shifts must be between -100 and 100'
  );

  return createOperation(
    async (bitmap, params: ColorBalanceOptions) => {
      const newData = new Uint8ClampedArray(bitmap.data);
      
      for (let i = 0; i < newData.length; i += 4) {
        const r = newData[i];
        const g = newData[i + 1];
        const b = newData[i + 2];
        
        if (params.preserveLuminance) {
          // Preserve luminance while shifting colors
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          newData[i] = Math.min(255, Math.max(0, r + params.redShift));
          newData[i + 1] = Math.min(255, Math.max(0, g + params.greenShift));
          newData[i + 2] = Math.min(255, Math.max(0, b + params.blueShift));
          
          // Adjust to maintain original luminance
          const newLuminance = 0.299 * newData[i] + 0.587 * newData[i + 1] + 0.114 * newData[i + 2];
          const correction = luminance / newLuminance;
          newData[i] *= correction;
          newData[i + 1] *= correction;
          newData[i + 2] *= correction;
        } else {
          newData[i] = Math.min(255, Math.max(0, r + params.redShift));
          newData[i + 1] = Math.min(255, Math.max(0, g + params.greenShift));
          newData[i + 2] = Math.min(255, Math.max(0, b + params.blueShift));
        }
      }
      
      return new ImageData(newData, bitmap.width, bitmap.height);
    },
    options
  );
};

// Usage with type safety
const warmBalance = colorBalance({
  redShift: 15,
  greenShift: 5,
  blueShift: -10,
  preserveLuminance: true
});
```

### Type Guards

```typescript
import { isOperationFunction } from 'pixly';

const someFunction = brightness(10);
const notAnOperation = (x: number, y: number) => x + y;

if (isOperationFunction(someFunction)) {
  // TypeScript knows this is an OperationFunction
  await applyOperation(processor, someFunction);
}

if (isOperationFunction(notAnOperation)) {
  // This won't execute
  await applyOperation(processor, notAnOperation);
}
```

## Error Handling

### Robust Custom Operations

```typescript
const robustCustomOperation = createOperation(
  async (bitmap, intensity: number) => {
    try {
      // Validate input
      if (!bitmap || !bitmap.data) {
        throw new Error('Invalid bitmap data');
      }
      
      if (bitmap.width <= 0 || bitmap.height <= 0) {
        throw new Error('Invalid bitmap dimensions');
      }
      
      // Perform operation
      const newData = new Uint8ClampedArray(bitmap.data);
      
      // ... operation logic ...
      
      return new ImageData(newData, bitmap.width, bitmap.height);
      
    } catch (error) {
      console.error('Custom operation failed:', error);
      throw new Error(`Custom operation error: ${error.message}`);
    }
  },
  50 // intensity parameter
);
```

## Performance Considerations

### Efficient Pixel Processing

```typescript
// ✅ Good: Process pixels in chunks
const efficientOperation = createOperation(
  async (bitmap) => {
    const { data, width, height } = bitmap;
    const newData = new Uint8ClampedArray(data.length);
    
    // Process in chunks for better cache locality
    const chunkSize = 1024 * 4; // 1024 pixels at a time
    
    for (let start = 0; start < data.length; start += chunkSize) {
      const end = Math.min(start + chunkSize, data.length);
      
      for (let i = start; i < end; i += 4) {
        // Process pixel at index i
        newData[i] = data[i];     // Red
        newData[i + 1] = data[i + 1]; // Green
        newData[i + 2] = data[i + 2]; // Blue
        newData[i + 3] = data[i + 3]; // Alpha
      }
    }
    
    return new ImageData(newData, width, height);
  }
);

// ❌ Avoid: Creating new arrays unnecessarily
const inefficientOperation = createOperation(
  async (bitmap) => {
    // Don't create intermediate arrays for each pixel
    const pixels = [];
    for (let i = 0; i < bitmap.data.length; i += 4) {
      pixels.push([bitmap.data[i], bitmap.data[i + 1], bitmap.data[i + 2], bitmap.data[i + 3]]);
    }
    // ... process pixels array ...
  }
);
```

### Memory-Efficient Operations

```typescript
// For large images, consider processing in place when possible
const inPlaceOperation: OperationFunction = async (bitmap) => {
  // Clone the data only once
  const newData = new Uint8ClampedArray(bitmap.data);
  
  // Modify newData directly instead of creating temporary variables
  for (let i = 0; i < newData.length; i += 4) {
    newData[i] = Math.min(255, newData[i] * 1.2);     // Red
    newData[i + 1] = Math.min(255, newData[i + 1] * 1.2); // Green
    newData[i + 2] = Math.min(255, newData[i + 2] * 1.2); // Blue
  }
  
  return new ImageData(newData, bitmap.width, bitmap.height);
};
```

## Migration from Object-Based Operations

If you're migrating from the old object-based operation system:

```typescript
// ❌ Old object-based style (no longer supported)
const oldResizeOperation = {
  type: 'resize',
  params: { width: 800, height: 600, fit: 'contain' }
};

// ✅ New function-based style
const newResizeOperation = resize({
  width: 800,
  height: 600,
  fit: 'contain',
  position: 'center',
  background: [0, 0, 0, 0]
});

// Usage is the same
const result = await applyOperation(processor, newResizeOperation);
```

The function-based approach provides:
- Better type safety
- Improved performance (no switch statements)
- Natural function composition
- Easier testing and debugging
- More intuitive API