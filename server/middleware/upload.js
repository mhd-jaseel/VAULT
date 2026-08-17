import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = 'uploads';

// Create uploads directory if it does not exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const sanitizedExt = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const cleanFieldName = file.fieldname.replace(/[^a-zA-Z0-9_-]/g, '');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${cleanFieldName}-${uniqueSuffix}${sanitizedExt || '.jpg'}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExts = /\.(jpeg|jpg|png|webp|jfif|pjpeg|pjp|avif)$/i;
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'image/jfif',
    'image/pjpeg',
    'image/avif',
    'application/octet-stream', // Fallback for some Windows image uploads
  ];
  const extValid = allowedExts.test(file.originalname);
  const mimeValid = allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('image/');

  if (extValid || mimeValid) {
    return cb(null, true);
  } else {
    const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
    err.message = 'Only JPEG, JPG, PNG, WEBP, and JFIF image files are allowed.';
    cb(err);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export default upload;
