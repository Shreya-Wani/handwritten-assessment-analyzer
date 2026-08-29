# AI Assessment Analyzer

The **AI Assessment Analyzer** is a completely local, deterministic evaluation pipeline designed to extract, map, and review handwritten student assessments against printed question papers without relying on brittle LLM hallucination or expensive cloud APIs.

## Features
- **Strict PDF/Image Preprocessing**: Normalizes all documents to a canonical resolution.
- **Printed Question Extraction**: Structurally separates multipart questions (`Q3(a)`, `Q3(b)`).
- **Handwritten Answer Extraction**: Identifies handwritten text boundaries and reference numbers.
- **Deterministic Mapping**: Associates extracted answers with printed questions via Exact Match, Normalized Match, and Contextual Structural Inference.
- **Responsive Exact-Region Highlighting**: Graphically overlays handwritten ink using 100% mathematically relative CSS floats for zero-distortion alignment across viewports.
- **Conflict & Out-of-Order Handling**: Automatically traps ambiguously numbered answers (e.g., duplicates) or unmapped entries and routes them to a manual review pane.
- **Manual Grading Layer**: Supports granular teacher review and manual grading against exact extracted `maxMarks`.

## Architecture & Tech Stack
- **Frontend**: React, TailwindCSS, Vite.
- **Backend**: Node.js, Express.
- **Database**: Ephemeral In-Memory Store (`assessmentStore.ts`) — *No MongoDB required*.
- **Computer Vision / OCR**: `tesseract.js` (WebAssembly) running offline in background threads. PDF rasterization via `pdfjs-dist` and Canvas/Sharp.

## Folder Structure
```text
/client
  /src
    /components  # Layout and Reviewer components (AnswerSheetViewer, etc.)
    /pages       # Dashboard (Upload) and Reviewer
    /services    # API integration
/server
  /src
    /controllers # Express route controllers
    /services    # Extraction, Preprocessing, and Mapping engines
    /store       # In-memory assessment datastore
```

## Local Setup

**Requirements:**
- Node.js (v18+)
- npm

**Installation:**
```bash
# Install root dependencies
npm install

# Install server and client workspaces
npm run install:all
```

## Environment Variables
The `.env` file should be placed in the `server` directory.
A sample `.env.example` is provided:
```env
PORT=5000
NODE_ENV=development
# API_URL is strictly for configuration if deployed
```
*Note: Do not commit `.env`. Uploaded files are also gitignored.*

## How to Run
We use NPM workspaces to concurrently launch the pipeline.

```bash
# Start both client (Vite) and server (Express) concurrently
npm run dev
```

Alternatively:
- **Server only**: `npm run dev:server` (Starts on `http://localhost:5000`)
- **Client only**: `npm run dev:client` (Starts on `http://localhost:5173`)

## API Overview
- `POST /api/assessments/upload` - Securely ingests PDFs/Images.
- `POST /api/assessments/:id/process` - Rasterizes and normalizes pages.
- `POST /api/assessments/:id/extract-questions` - Generates the canonical `Question[]` struct.
- `POST /api/assessments/:id/extract-answers` - Generates the canonical `StudentAnswer[]` struct.
- `POST /api/assessments/:id/map-answers` - Runs the deterministic heuristic matching engine.
- `PATCH /api/assessments/:id/questions/:qId/grade` - Submits a manual grade.

## Known Limitations
- Server restarts will completely clear the ephemeral datastore.
- `tesseract.js` operates optimally on text; extremely complex visual geometry (sketches) lacking any alphanumeric labeling may be entirely bypassed by the OCR block detector.

## Deployment Instructions
1. Run `npm run build` to compile the TypeScript definitions and output the static Vite payload.
2. Serve `client/dist` out of Nginx or equivalent.
3. Keep the `server` running as a background node process. Ensure standard Node disk/upload quotas (`client_max_body_size`) are generous enough for 10MB+ PDF files.