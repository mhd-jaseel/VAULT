import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const deleteImageFiles = (imagePaths) => {
  if (!imagePaths || !Array.isArray(imagePaths)) return;
  imagePaths.forEach((img) => {
    if (img && img.startsWith('/uploads/')) {
      const fileName = img.replace('/uploads/', '');
      const filePath = path.join(__dirname, '..', '..', 'uploads', fileName);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error(`Failed to delete file: ${filePath}`, err);
        }
      });
    }
  });
};
