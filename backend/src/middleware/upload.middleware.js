import multer from 'multer';
import path from 'path';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage(); // Use memory storage → stream to Cloudinary

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(400, `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`),
      false
    );
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

/**
 * Multer error handler — converts multer errors to ApiError.
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`));
    }
    return next(new ApiError(400, err.message));
  }
  next(err);
};
