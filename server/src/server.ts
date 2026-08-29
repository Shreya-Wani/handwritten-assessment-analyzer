import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import healthRouter from './routes/health';
import assessmentRouter from './routes/assessmentRoutes';
import { ensureUploadsDir } from './services/fileService';
import { MAX_FILE_SIZE_MB, ALLOWED_EXTENSIONS } from './config/constants';

// Load environment variables
dotenv.config();

// Ensure the temporary uploads directory exists before Multer tries to write to it
ensureUploadsDir();

const app = express();
const port = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api/assessments', assessmentRouter);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Global error handler ────────────────────────────────────────────────────
// Must have four parameters so Express recognises it as an error handler.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Handle Multer-specific errors cleanly
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        message: `Each file must be smaller than ${MAX_FILE_SIZE_MB} MB.`,
        code: 'FILE_TOO_LARGE',
      });
      return;
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      // We reuse this code for unsupported MIME types (see uploadMiddleware)
      res.status(400).json({
        success: false,
        message: `Unsupported file type. Allowed formats: ${ALLOWED_EXTENSIONS}.`,
        code: 'UNSUPPORTED_FILE_TYPE',
      });
      return;
    }
  }

  // Generic server error — never expose internal details to the client
  res.status(500).json({
    success: false,
    message: 'Upload failed. Please try again.',
    code: 'SERVER_ERROR',
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`Assessment API Server is running on port ${port}`);
});
