import path from 'path';

/**
 * Maximum file size per upload (10 MB).
 * Used both in Multer configuration and error messages.
 */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/** Human-readable file size limit for error messages. */
export const MAX_FILE_SIZE_MB = 10;

/**
 * Allowed MIME types for uploaded assessment documents.
 * Validated by Multer fileFilter on the server.
 */
export const ALLOWED_MIME_TYPES: ReadonlyArray<string> = [
  'application/pdf',
  'image/png',
  'image/jpeg',
];

/** Allowed file extensions (for display purposes in error messages). */
export const ALLOWED_EXTENSIONS = '.pdf, .png, .jpg, .jpeg';

/**
 * Absolute path to the temporary uploads directory.
 * Files here are never committed to Git.
 */
export const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
