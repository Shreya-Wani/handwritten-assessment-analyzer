# Architectural Approach

## Problem
Evaluating handwritten assessments poses significant structural challenges: extracting standardized layout structures (printed questions) alongside unbounded variance layouts (handwritten text), and then deterministically mapping the two domains without relying on brittle LLM reasoning.

## Solution
The AI Assessment Analyzer resolves this entirely locally by dividing the problem into strict, decoupled domains: Document Preprocessing -> Question Extraction -> Answer Extraction -> Deterministic Mapping -> Responsive Visual Review.

## Architecture
- **Backend**: Express/Node.js utilizing an in-memory datastore for blazing-fast local processing without MongoDB boilerplate.
- **Frontend**: React + Tailwind + Vite, emphasizing a strictly Figma-compliant design language.
- **Computer Vision**: Pure WebAssembly (`tesseract.js`) isolated in server-side web workers to circumvent heavy Python/C++ build chains while still delivering offline document analysis.

## OCR Approach
Rather than parsing raw unstyled text, Tesseract runs in two distinct passes:
1. **Layout Pass**: `tesseract.js` executes on the Question Paper, returning localized bounding boxes and text.
2. **Handwriting Pass**: Executed against the Student Answer Sheet, aggressively clamping returned bounding boxes to exactly match the canonical page size coordinates. 
*No paid AI APIs are utilized. The engine remains purely deterministic and local.*

## Question Extraction
Uses structural regex mapping (`/^\s*(?:Q\.?)?\s*(\d+)?\s*\.?\s*(?:\(\s*([a-zA-Z])\s*\))?/i`) to capture Question numbers and subparts (`3(a)`). If a question wraps across multiple lines, the bounding boxes are mathematically united.

## Answer Extraction
Spatially gathers adjacent handwritten blocks and identifies reference headers (e.g., `Ans 4`). Handled gracefully when the student forgets a number—orphaned answers remain completely isolated in an `unmatched` stack rather than hallucinating a false map.

## Mapping Strategy
Operates in 4 sequential passes:
1. **Exact Match**: String equivalence `11(b)` === `11(b)`.
2. **Normalized Match**: Space and casing stripped `Q. 11 (b)` === `11(b)`.
3. **Conflict Resolution**: Traps duplicate mapped questions, deliberately failing the mapping and surfacing it for the teacher.
4. **Structural Inference**: Infers missing question numbers if an anonymous answer sits chronologically perfectly bounded between `Q4` and `Q6`.

## Highlighting Strategy
Coordinate mapping relies heavily on relative CSS injection. The `AnswerHighlight` converts Phase 5 `[x, y, width, height]` parameters into exact CSS percentages relative to the intrinsic aspect ratio of the underlying `<img />`. This eliminates the need for expensive window resize event listeners or raw pixel calculations—boxes sit permanently locked over the students' handwritten ink regardless of viewport stretch or pan.

## Grading
A manual deterministic grading layer overlays the review interface. Marks are firmly constrained against the extracted `maxMarks`, automatically calculating the aggregate score summary in real-time, cleanly decoupled from the OCR pipeline.

## Limitations
- Backend restart clears the `assessmentStore`.
- Highly complex math diagrams (non-textual regions) are susceptible to being missed by `tesseract.js` if they do not contain contiguous characters.
