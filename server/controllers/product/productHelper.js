import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { deleteFromCloudinary } from '../../services/cloudinaryService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const deleteImageFiles = (imagePaths) => {
  if (!imagePaths || !Array.isArray(imagePaths)) return;
  imagePaths.forEach((img) => {
    if (img && typeof img === 'string') {
      if (img.includes('res.cloudinary.com')) {
        deleteFromCloudinary(img);
      } else if (img.startsWith('/uploads/')) {
        const fileName = img.replace('/uploads/', '');
        const filePath = path.join(__dirname, '..', '..', 'uploads', fileName);
        fs.unlink(filePath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error(`Failed to delete file: ${filePath}`, err);
          }
        });
      }
    }
  });
};
