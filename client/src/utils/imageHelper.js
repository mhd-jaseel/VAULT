/**
 * VAULT Central Image Helper & URL Resolver
 * 
 * Provides consistent URL resolution for all images (products, categories, brands, campaigns, banners, avatars)
 * across the entire VAULT application.
 */

// Determine backend API server URL from environment or dev default
export const getServerBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    // Clean trailing /api or slashes: 'https://vault-co-api.onrender.com/api/' -> 'https://vault-co-api.onrender.com'
    return apiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }

  // Local development fallback when on localhost dev ports
  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      return 'http://localhost:5000';
    }
  }

  // Production default fallback (works across any custom domain or Vercel preview)
  return 'https://vault-co-api.onrender.com';
};

/**
 * Resolves any image path (full URL, relative path, filename, or legacy asset)
 * into a fully qualified, valid image URL.
 * 
 * Rules:
 * 1. Data URLs / Blobs -> return unchanged
 * 2. Absolute external URLs (e.g. Cloudinary / S3 / CDN) -> return unchanged
 * 3. Relative server paths -> resolve against backend server base URL
 * 
 * @param {string|null|undefined} url - The raw image path from database or state
 * @returns {string} Fully qualified image URL or empty string
 */
export const resolveImage = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // 1. Data URLs or Blobs (e.g. client previews)
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // 2. Absolute external URLs (e.g. Cloudinary / S3 / CDN / HTTPS)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // 3. Normalize path: ensure leading slash
  let cleanPath = trimmed;
  if (!cleanPath.startsWith('/')) {
    cleanPath = cleanPath.startsWith('uploads/') ? `/${cleanPath}` : `/uploads/${cleanPath}`;
  }

  const baseUrl = getServerBaseUrl();
  return `${baseUrl}${cleanPath}`;
};

export default resolveImage;
