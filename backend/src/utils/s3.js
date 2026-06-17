import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const uploadDir = path.resolve('uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const uploadToS3 = async (file) => {
  const useMinIO = !!process.env.MINIO_ENDPOINT;
  const fileId = uuidv4();
  const ext = path.extname(file.originalname);
  const filename = `${fileId}${ext}`;

  if (useMinIO) {
    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      const s3 = new S3Client({
        endpoint: process.env.MINIO_ENDPOINT,
        region: process.env.MINIO_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
          secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
        },
        forcePathStyle: true
      });

      const bucket = process.env.MINIO_BUCKET || 'pharos-attachments';
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype
      }));

      const url = `${process.env.MINIO_ENDPOINT}/${bucket}/${filename}`;
      return { id: fileId, url, size: file.size, filename: file.originalname };
    } catch (err) {
      console.warn('[Storage] S3/MinIO upload failed, falling back to local file system.', err.message);
    }
  }

  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, file.buffer);
  
  const url = `/api/v1/records/attachments/download/${filename}`;
  return { id: fileId, url, size: file.size, filename: file.originalname, physicalPath: filePath };
};

export const deleteFromS3 = async (url) => {
  if (url && url.startsWith('/api/v1/records/attachments/download/')) {
    const filename = url.split('/').pop();
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('[Storage] Failed to delete local file:', err.message);
      }
    }
  }
};
