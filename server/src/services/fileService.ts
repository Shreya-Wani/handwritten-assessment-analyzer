import fs from 'fs';
import path from 'path';
import { UPLOADS_DIR } from '../config/constants';
import { UploadedFile } from '../types';

export const PROCESSED_DIR = path.join(__dirname, '../../processed');

/**
 * Ensures the uploads directory exists on disk.
 */
export function ensureUploadsDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Ensures the processed sub-directory exists for a specific assessment and document type.
 */
export const ensureProcessedDir = (assessmentId: string, docType: string): string => {
  const dir = path.join(PROCESSED_DIR, assessmentId, docType);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

/**
 * Deletes a single uploaded file by its stored filename.
 */
export function deleteUploadedFile(filename: string): void {
  if (!filename) return;
  const safeFilename = path.basename(filename);
  const filePath = path.join(UPLOADS_DIR, safeFilename);

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error(`Failed to delete file: ${filePath}`, error);
    }
  }
}

/**
 * Strips out internal paths and builds the normalized metadata.
 */
export function buildFileMetadata(
  multerFile: Express.Multer.File,
  fileIdOverride?: string
): UploadedFile {
  return {
    fileId: fileIdOverride || multerFile.filename,
    originalName: multerFile.originalname,
    size: multerFile.size,
    mimeType: multerFile.mimetype,
  };
}

/**
 * Utility to extract the file ID (the UUID filename) from a filename,
 * ensuring no path traversals.
 */
export function extractFileId(filename: string): string {
  return path.basename(filename);
}

/**
 * Cleans up original files and processed page images for a given assessment.
 */
export function cleanupAssessmentFiles(assessmentId: string, qpFileId?: string, asFileId?: string): void {
  if (qpFileId) deleteUploadedFile(qpFileId);
  if (asFileId) deleteUploadedFile(asFileId);

  const assessmentProcessedDir = path.join(PROCESSED_DIR, assessmentId);
  if (fs.existsSync(assessmentProcessedDir)) {
    try {
      fs.rmSync(assessmentProcessedDir, { recursive: true, force: true });
    } catch (e) {
      console.error(`Failed to delete processed dir for ${assessmentId}`, e);
    }
  }
}
