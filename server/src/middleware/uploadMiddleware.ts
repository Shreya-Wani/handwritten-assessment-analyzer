import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import crypto from 'crypto';
import { Request } from 'express';
import {
  UPLOADS_DIR,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
} from '../config/constants';

/**
 * Disk storage engine.
 *
 * - destination: the pre-created server/uploads directory.
 * - filename: crypto.randomUUID() + original extension, so the stored name
 *   is never derived from user-controlled input (prevents path traversal).
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${crypto.randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

/**
 * File filter — rejects any MIME type not in the allow-list.
 * Multer calls this *before* writing anything to disk.
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        'LIMIT_UNEXPECTED_FILE' as multer.MulterError['code'],
        file.fieldname,
      ),
    );
  }
};

/**
 * Configured Multer instance.
 *
 * Accepts exactly two named fields:
 *   - questionPaper  (maxCount: 1)
 *   - answerSheet    (maxCount: 1)
 *
 * limits.fileSize is enforced by Multer before the file hits the controller.
 */
export const uploadFields = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
}).fields([
  { name: 'questionPaper', maxCount: 1 },
  { name: 'answerSheet', maxCount: 1 },
]);

// Re-export for use in the error handler
export { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES };
