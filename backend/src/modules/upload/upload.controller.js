import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('application/pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type! Only images and PDFs are allowed.'));
    }
  }
});

export const uploadMiddleware = upload.single('file');

export const handleUpload = (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }
    
    // Return the path so frontend can store it in the JSONB data
    res.status(200).json({
      status: 'success',
      data: {
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    next(error);
  }
};
