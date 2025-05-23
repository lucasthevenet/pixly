# Scratchpad

## Current Active Task
| Field | Value |
|-------|-------|
| Task Name | Build image transformation & compression utility |
| Implementation Plan | `docs/implementation-plan/image-transform-utility.md` |
| Branch Name | `feat/image-transform-utility` |
| Planner | _TBD_ |
| Executor | _TBD_ |

## Quick Links
- Implementation Detail File: `docs/implementation-plan/image-transform-utility.md`
- Guideline Reference: `docs/GUIDELINE.md`

---

## Running Notes & Insights
<!-- Append high-level thoughts, open questions, and design considerations here. -->

---

## Lessons Learned
<!-- Keep a dated, bullet-point list of lessons to avoid repeating mistakes. -->
<!-- Example: - [2025-05-19] Remember to read the file before editing. -->
- [2025-05-19] WASM codecs like @jsquash/png require manual WASM initialization in Node.js test environments. Use the `init` function with the WASM binary loaded from node_modules for tests to pass.
- [2025-05-19] This applies to both decode and encode modules from @jsquash/png: both require WASM initialization in Node.js before use.
