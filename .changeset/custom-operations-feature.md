---
"pixly": minor
---

Add comprehensive custom operations support with function-based architecture

This release introduces a complete custom operations system that allows users to create and use custom image processing operations alongside built-in operations. The implementation migrates from object-based operations to a more flexible function-based approach.

**New Features:**
- Custom operation functions with type safety (`OperationFunction` type)
- Operation builder utilities (`createOperation`, `createSafeOperation`)
- Operation composition and conditional operations (`composeOperations`, `createConditionalOperation`)
- Parameter validation helpers (`validateOperationParams`)
- Type guards for runtime validation (`isOperationFunction`)
- 9 built-in custom operations: brightness, contrast, grayscale, sepia, invert, tint, sharpen, pixelate, adjustChannels

**Breaking Changes:**
- Migrated all built-in operations (resize, rotate, flip, crop, blur) to function-based style
- Removed object-based operation interfaces (`ResizeOperation`, `RotateOperation`, etc.)
- `applyOperation` now only accepts operation functions, not operation objects
- Simplified `Operation` type to just `OperationFunction`

**Performance Improvements:**
- Eliminated switch statement overhead in `applyOperation`
- Direct function calls for better performance
- Memory-efficient operation execution

**Developer Experience:**
- Better TypeScript inference and type safety
- Natural function composition patterns
- Comprehensive documentation with usage examples
- Error handling with descriptive messages
- 102 test cases covering all functionality

This change maintains API compatibility at the function level while providing much more flexibility for custom image processing workflows.