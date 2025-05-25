# Composable API Redesign Implementation Plan

## Background and Motivation

The current API uses a factory pattern with separate methods for different output formats (`toBuffer`, `toBlob`, `toDataURL`). The user wants to rebuild this into a more composable and fluent API where:

1. All operations go through a single `.apply()` method
2. Presets can be created and reused as composed operations
3. Decoders and encoders are explicitly set via fluent methods
4. Processing returns a result object with conversion methods
5. The API is more intuitive and follows a builder pattern similar to popular libraries

Desired API example:
```typescript
// Build complex operation chains
const instagramPreset = pixly()
  .apply(resize({ width: 1080, height: 1080, fit: "cover" }))
  .apply(sharpen(1.1))
  .apply(brightness(1.05))
  .preset(); // Returns single composed operation

// Everything goes through .apply() with single operations
const result = await pixly()
  .decoder(auto())
  .apply(resize({ width: 100 })) // Built-in operation
  .apply(instagramPreset) // Preset operation
  .encoder(webp({ quality: 0.8 }))
  .process(inputImage);

const blob = result.toBlob();
```

## Key Challenges and Analysis

### 1. API Architecture Changes
- Current: Factory returns an object with direct output methods
- Target: Builder pattern with fluent interface and separate result object
- Challenge: Maintaining backward compatibility while transitioning

### 2. Preset System
- Need to implement `.preset()` method that returns a composed operation
- Presets should be reusable and composable themselves
- Must integrate seamlessly with the `.apply()` method

### 3. Decoder/Encoder Configuration
- Current: Decoder is part of config, encoder is part of output options
- Target: Explicit `.decoder()` and `.encoder()` methods in the chain
- Need to handle auto-detection gracefully

### 4. Result Object Design
- Current: Direct conversion methods on the builder
- Target: Separate result object returned from `.process()`
- Result should contain the processed image data and conversion methods

### 5. Type Safety
- Ensure full TypeScript support throughout the fluent API
- Maintain type inference for operations and their parameters
- Result object should be properly typed

## High-level Task Breakdown

### Task 1: Create Feature Branch
- **Description**: Create a new feature branch for the API redesign
- **Success Criteria**: 
  - Branch created from main
  - Initial commit made
  - Branch name: `composable-api-redesign`

### Task 2: Design New Type Definitions
- **Description**: Create comprehensive TypeScript interfaces for the new API
- **Success Criteria**:
  - `ImageBuilder` interface with fluent methods
  - `ProcessingResult` interface for result object
  - `DecoderConfig` and `EncoderConfig` types
  - `Preset` type for composed operations
  - All types exported and documented

### Task 3: Implement Core Builder Class
- **Description**: Create the new builder class with basic structure
- **Success Criteria**:
  - `ImageBuilder` class with constructor
  - Internal state management for operations, decoder, encoder
  - Basic `.apply()` method structure
  - Unit tests for builder creation and state

### Task 4: Implement Decoder/Encoder Methods
- **Description**: Add `.decoder()` and `.encoder()` fluent methods
- **Success Criteria**:
  - `.decoder()` method accepts decoder config or "auto"
  - `.encoder()` method accepts format and options
  - Methods return builder instance for chaining
  - Auto-detection logic preserved
  - Tests for various decoder/encoder configurations

### Task 5: Implement Preset System
- **Description**: Add `.preset()` method to create reusable composed operations
- **Success Criteria**:
  - `.preset()` returns a single composed operation function
  - Presets can be applied via `.apply()`
  - Presets maintain proper type safety
  - Tests for preset creation and application

### Task 6: Implement Process Method and Result Object
- **Description**: Create `.process()` method and `ProcessingResult` class
- **Success Criteria**:
  - `.process()` executes the pipeline and returns result
  - `ProcessingResult` has `.toBuffer()`, `.toBlob()`, `.toDataURL()`
  - Result object properly encapsulates processed data
  - Comprehensive tests for processing and conversions

### Task 7: Update Factory Function
- **Description**: Update the `pixly()` factory to return new builder
- **Success Criteria**:
  - Factory returns `ImageBuilder` instance
  - Optional config still supported
  - Backward compatibility considerations documented
  - Integration tests pass

### Task 8: Create Decoder/Encoder Helper Functions
- **Description**: Create helper functions for common decoder/encoder configs
- **Success Criteria**:
  - `auto()` decoder helper
  - Format-specific encoder helpers (e.g., `webp()`, `jpeg()`)
  - Helpers provide good defaults
  - TypeScript autocompletion works

### Task 9: Documentation and Examples
- **Description**: Create comprehensive documentation for new API
- **Success Criteria**:
  - API reference documentation
  - Migration guide from old API
  - Multiple usage examples
  - Performance considerations documented

### Task 10: Performance Testing and Optimization
- **Description**: Ensure new API doesn't introduce performance regressions
- **Success Criteria**:
  - Benchmark tests comparing old vs new API
  - Memory usage analysis
  - Optimization of any bottlenecks
  - Performance report documented

## Branch Name
`composable-api-redesign`

## Project Status Board

### TODO
- [ ] Task 2: Design new type definitions
- [ ] Task 3: Implement core builder class
- [ ] Task 4: Implement decoder/encoder methods
- [ ] Task 5: Implement preset system
- [ ] Task 6: Implement process method and result object
- [ ] Task 7: Update factory function
- [ ] Task 8: Create decoder/encoder helper functions
- [ ] Task 9: Documentation and examples
- [ ] Task 10: Performance testing and optimization

### In Progress
- [ ] Task 2: Design new type definitions

### Completed
- [x] Task 1: Create feature branch (feat/composable-api-redesign)

### Blocked

## Current Status / Progress Tracking
- **Status**: Task 1 completed, beginning Task 2
- **Next Step**: Design new type definitions for the composable API
- **Last Updated**: Task 1 completed - feature branch created (feat/composable-api-redesign)

## Executor's Feedback or Assistance Requests

### Task 1 Completion Report
- ✅ **Completed**: Feature branch `feat/composable-api-redesign` successfully created
- **Git Status**: On branch feat/composable-api-redesign, working tree clean
- **Ready for**: Task 2 - Design new type definitions

### Next Steps
Moving to Task 2: Design new type definitions. This will involve:
1. Creating comprehensive TypeScript interfaces for the new API
2. Defining `ImageBuilder`, `ProcessingResult`, decoder/encoder configs
3. Ensuring full type safety and inference throughout the fluent API

## Lessons Learned
<!-- To be documented during implementation -->

## Additional Technical Notes

### Breaking Changes
This redesign will introduce breaking changes to the public API. Consider:
1. Providing a compatibility layer or adapter
2. Major version bump in package.json
3. Clear migration documentation

### Implementation Strategy
1. Build new API alongside existing one
2. Gradually migrate internal usage
3. Deprecate old API with warnings
4. Remove old API in next major version

### Testing Strategy
1. Unit tests for each component
2. Integration tests for full workflows
3. Performance benchmarks
4. Type safety tests
5. Example-based tests from documentation