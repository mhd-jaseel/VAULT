import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a local file (from Multer disk storage) to Cloudinary
 * @param {string} localFilePath - Path or filename of the local file
 * @param {string} folder - Destination folder on Cloudinary (default: 'vault')
 * @returns {Promise<string>} - Permanent HTTPS secure_url
 */
export const uploadToCloudinary = async (localFilePath, folder = 'vault') => {
  if (!localFilePath) return '';

  // If already a full external URL, return as is
  if (localFilePath.startsWith('http://') || localFilePath.startsWith('https://')) {
    return localFilePath;
  }

  // Resolve absolute path on disk
  let resolvedPath = localFilePath;
  if (localFilePath.startsWith('/uploads/')) {
    resolvedPath = path.join(process.cwd(), 'uploads', localFilePath.replace('/uploads/', ''));
  } else if (localFilePath.startsWith('uploads/')) {
    resolvedPath = path.join(process.cwd(), localFilePath);
  } else if (!path.isAbsolute(localFilePath)) {
    resolvedPath = path.join(process.cwd(), 'uploads', localFilePath);
  }

  if (!fs.existsSync(resolvedPath)) {
    console.warn(`[Cloudinary] File not found at ${resolvedPath}, returning original path.`);
    return localFilePath;
  }

  try {
    const result = await cloudinary.uploader.upload(resolvedPath, {
      folder: folder,
      resource_type: 'image',
    });

    // Clean up temporary local upload file after successful Cloudinary upload
    fs.unlink(resolvedPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('[Cloudinary] Failed to clean up temp file:', resolvedPath, err);
      }
    });

    return result.secure_url;
  } catch (error) {
    console.error('[Cloudinary] Upload failed:', error);
    throw new Error(`Image upload to storage service failed: ${error.message}`);
  }
};

/**
 * Safely delete an image from Cloudinary (if it's a Cloudinary URL) or local filesystem (if legacy)
 * NEVER deletes static seed assets like /uploads/wallets.webp.
 * @param {string} imageUrl - The stored image URL
 */
export const deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return;

  // Protect seed / static assets from deletion
  const staticSeedAssets = [
    'wallets.webp', 'belts.webp', 'rings.webp', 'caps.webp', 'watches.webp',
    'sunglasses.webp', 'bracelets.webp', 'chains.webp', 'earrings.webp',
    'perfumes.webp', 'shoes.webp', 'chappals.webp',
  ];
  if (staticSeedAssets.some((seed) => imageUrl.includes(seed))) {
    return;
  }

  // If it's a Cloudinary URL, extract public_id and destroy
  if (imageUrl.includes('res.cloudinary.com')) {
    try {
      const parts = imageUrl.split('/');
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex !== -1) {
        // e.g. https://res.cloudinary.com/cloud/image/upload/v12345/vault/filename.jpg -> vault/filename
        const pathAfterUpload = parts.slice(uploadIndex + 2).join('/');
        const publicId = pathAfterUpload.replace(/\.[^/.]+$/, '');
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
    } catch (err) {
      console.error('[Cloudinary] Failed to delete remote asset:', err);
    }
  } else if (imageUrl.startsWith('/uploads/')) {
    // Legacy local file cleanup
    const fileName = imageUrl.replace('/uploads/', '');
    const localPath = path.join(process.cwd(), 'uploads', fileName);
    fs.unlink(localPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('[Storage] Failed to delete local file:', localPath, err);
      }
    });
  }
};

export default cloudinary;
