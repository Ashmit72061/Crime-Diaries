import cloudinary from '../config/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import { Readable } from 'stream';

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer from multer memory storage
 * @param {object} options - Cloudinary upload options
 * @returns {Promise<object>} Cloudinary upload result
 */
export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'crime-diaries',
        resource_type: options.resource_type || 'image',
        transformation: options.transformation,
        public_id: options.public_id,
      },
      (error, result) => {
        if (error) return reject(new ApiError(500, `Upload failed: ${error.message}`));
        resolve(result);
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

/**
 * Delete an asset from Cloudinary by public_id.
 * @param {string} publicId
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return null;
  return cloudinary.uploader.destroy(publicId);
};

/**
 * Extract Cloudinary public_id from a full URL.
 * @param {string} url
 */
export const extractPublicId = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return filename.split('.')[0];
};
