# Image Transformation & Compression Utility – Implementation Plan

| Field | Value |
---

## 7. Current Status / Progress Tracking
- [2025-05-19] API scaffold (`src/imagekit.ts`), isomorphic entrypoints, and initial test suite created.
- [2025-05-19] `npm test` passes for API surface and chaining.
- [2025-05-19] Minimal passthrough implementation for `ImageKit.from` and `toBuffer` complete; round-trip buffer test passes.
- [2025-05-19] Implemented image decoding in `ImageKit.from` using `@jsquash/png` (and other decoders as stubs).
- [2025-05-19] Added test for PNG decoding with manual WASM initialization in Node.js; all tests pass.
- [2025-05-19] Implemented PNG output encoding in `toBuffer` using `@jsquash/png/encode` with WASM init for Node.js.
- [2025-05-19] Added test for PNG output encoding and round-trip decode; all tests pass.

| Branch Name | `feat/image-transform-utility` |
| Planner | *TBD* |
| Executor | *TBD* |

---

## 1. Background and Motivation
Modern web & Node.js applications frequently need lightweight, on-the-fly image manipulation—resizing, format conversion, and compression—to improve load times and storage efficiency. A single, **isomorphic** API that works in both the browser (via ES Modules / IIFE) and Node.js (via CommonJS / ESM) simplifies developer experience and reduces duplicated logic across environments.

---

## 2. Success / Acceptance Criteria
1. Provide a **uniform function API** (detailed below) available as:
   - `import { ImageKit } from 'pixly'` (ESM)  
   - `const { ImageKit } = require('pixly')` (CJS)
2. Core operations:
   - `resize` (width/height, fit modes)  
   - `compress` (quality/codec)  
   - `convert` (target format)  
   - `rotate`, `flip`, `crop` (optional stretch goal)  
3. Browser bundle ≤ 35 kB gzipped; Node.js build ≤ 50 kB gzipped.
4. Zero external native dependencies; Leverage pure JS + optional WebAssembly fallback (e.g. Squoosh codecs) with graceful degradation.
5. Unit tests > 95 % line coverage with realistic image fixtures.
6. TypeScript types included (`*.d.ts`) and API docs generated.
7. CI job passing (lint + test + build) on GitHub Actions.

---

## 3. Key Challenges and Analysis
| Challenge | Notes / Potential Approach |
|-----------|---------------------------|
| Cross-platform binary data handling | Use `Uint8Array`/`ArrayBuffer` as universal image buffer representation. |
| Codec performance in browsers vs Node | Prefer WebAssembly codecs (e.g. MozJPEG, WebP, AVIF) behind dynamic import; fallback to Canvas API / Sharp only in Node if WA not supported. |
| Bundle size management | Tree-shakeable, lazy-load heavy codecs. Export “lite” build without WASM. |
| API ergonomics | Fluent builder vs static functions—lean toward **fluent chainable class** for readability (`ImageKit.from(buffer).resize({w:100}).toBuffer()`). |
| Testing binary equality | Compare perceptual hashes or pixel diff with threshold to tolerate codec differences. |

---
 
### Chosen Codec Libraries
Using the @jsquash family for encoding, decoding, and resizing:
- @jsquash/avif
- @jsquash/jpeg
- @jsquash/jxl
- @jsquash/oxipng
- @jsquash/png
- @jsquash/qoi
- @jsquash/resize
- @jsquash/webp

## 4. Proposed Function API (v1)

```ts
// pseudo-types
interface ResizeOptions { width?: number; height?: number; fit?: 'cover'|'contain'|'fill'|'inside'|'outside'; }
interface CompressOptions { quality?: number; codec?: 'jpeg'|'webp'|'png'|'avif'; }
interface OutputOptions { format?: 'jpeg'|'webp'|'png'|'avif'; }

class ImageKit {
  /* Factory */
  static from(input: ArrayBuffer | Uint8Array | Blob | File | string /* URL */): Promise<ImageKit>;

  /* Transformations */
  resize(opts: ResizeOptions): this;
  compress(opts?: CompressOptions): this;
  rotate(angle: number): this;
  flip(direction: 'horizontal' | 'vertical'): this;
  crop(x: number, y: number, width: number, height: number): this;
  /** @internal */ _convert(opts: OutputOptions): this;


  /* Output */
  toBuffer(opts?: OutputOptions): Promise<Uint8Array>;     // Node & browser
  toBlob(opts?: OutputOptions): Promise<Blob>;             // Browser only; Node shim throws
  toDataURL(opts?: OutputOptions): Promise<string>;        // data:image/... base64
}
```

---

## 5. High-level Task Breakdown

| # | Task | Owner | Success Criteria | Status |
|---|------|-------|------------------|--------|
| 0 | Create feature branch `feat/image-transform-utility` | Executor | Branch pushed | ☐ |
| 1 | Select codec libs (@jsquash/* suite) | Planner | Decision documented; libs recorded | ✅ |
| 2 | Project scaffolding: package setup, build (Rollup + tsup), test infra (Jest) | Executor | `npm test` & `npm run build` succeed | ✅ |
| 3 | Implement minimal `ImageKit.from` factory & `toBuffer` passthrough (no transform) | Executor | Round-trip buffer equality test passes | ✅ (buffer passthrough logic and test complete) |
| 4 | Implement PNG decoding and output encoding (`@jsquash/png`) | Executor | PNG round-trip decode/encode test passes | ✅ |
| 5 | Implement `resize` (Canvas in browser, Sharp or WASM in Node) | Executor | Resize unit tests & size assertions pass | ☐ |
| 6 | Implement `rotate`, `flip`, `crop` transformations | Executor | Transform unit tests (pixel diff / geometry) pass | ☐ |
| 7 | Implement `compress` with quality parameter | Executor | File size reduction ≥ 30 % on sample | ☐ |
| 8 | Implement multi-format output encoding via optional `format` param | Executor | Output matches requested MIME | ☐ |
| 9 | Bundle split & tree-shaking verification; size budgets enforced | Executor | Bundle analyzer report < thresholds | ☐ |
| 9 | TypeScript declarations & JSDoc generation | Executor | `tsc --noEmit` passes; docs generated | ☐ |
|10 | CI pipeline (lint, test, build) on GitHub Actions | Executor | Green status badge | ☐ |
|11 | Write README usage examples & publish dry-run to npm `next` tag | Executor | README contains copy-paste runnable code | ☐ |
|12 | Manual QA (browser demo page + Node script) | Planner | Visual inspection OK | ☐ |
|13 | Merge PR, tag release `v0.1.0` | Planner | GitHub release notes | ☐ |

---

## 6. Project Status Board

- [ ] **Planning**
  - [ ] Clarify codec library decision
  - [ ] Finalize API surface & parameter names
- [ ] **Execution**
  - [ ] Branch created
  - [ ] Scaffold completed
  - [ ] Transformations implemented
  - [ ] CI green
- [ ] **Documentation**
  - [ ] README examples
  - [ ] Typedoc site
- [ ] **Release**
  - [ ] npm publish
  - [ ] GitHub release notes

---

## 7. Current Status / Progress Tracking
*(To be updated by Executor after each vertical slice.)*
 
---
 
## 8. Executor's Feedback or Assistance Requests
- No blockers. WASM codecs (e.g., @jsquash/png) require manual WASM initialization in Node.js test environments. This is now handled in the test suite for PNG decoding and encoding. PNG output encoding is implemented and tested. Ready to proceed to additional formats or transformations.
 
 ---
 
## 9. Lessons Learned
*(Append dated bullet points as issues arise.)*
- [2025-05-19] WASM-based codecs like @jsquash/png require manual WASM initialization in Node.js (e.g., using the `init` function and reading the WASM file from node_modules). Vitest/Vite ESM test runner does not support Node.js built-ins inside test bodies; imports must be top-level.