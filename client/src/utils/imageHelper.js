/**
 * VAULT Central Image Helper & URL Resolver
 * 
 * Provides consistent URL resolution for all images (products, categories, brands, campaigns, banners, avatars)
 * across the entire VAULT application.
 */

// Determine base server URL from environment or fallback to origin/localhost
export const getServerBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    // e.g., 'https://vault-co-api.onrender.com' or 'https://api.vault.com/api' -> 'https://api.vault.com'
    return apiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }
  // Default to backend dev port if on frontend dev server (Vite default ports)
  if (typeof window !== 'undefined') {
    if (window.location.port === '5173' || window.location.port === '5174') {
      return 'http://localhost:5000';
    }
    // If deployed on Vercel or any non-localhost host without VITE_API_URL set,
    // point to the live Render backend production domain
    if (window.location.hostname.includes('vercel.app') || (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')) {
      return 'https://vault-co-api.onrender.com';
    }
    return window.location.origin;
  }
  return 'https://vault-co-api.onrender.com';
};

// Known legacy / seed path to available static webp asset mappings
const SEED_IMAGE_MAPPINGS = {
  // Legacy png to modern webp
  '/uploads/carbon_wallet.png': '/uploads/wallets.webp',
  '/uploads/gold_sunglasses.png': '/uploads/sunglasses.webp',
  '/uploads/oud_perfume.png': '/uploads/perfumes.webp',
  '/uploads/watch_chrono.png': '/uploads/watches.webp',
  '/uploads/belt.png': '/uploads/belts.webp',
  '/uploads/bracelet.png': '/uploads/bracelets.webp',
  '/uploads/cap.png': '/uploads/caps.webp',
  '/uploads/chain.png': '/uploads/chains.webp',
  '/uploads/ring.png': '/uploads/rings.webp',
  '/uploads/shoe.png': '/uploads/shoes.webp',
  '/uploads/sunglasses.png': '/uploads/sunglasses.webp',
  '/uploads/wallet.png': '/uploads/wallets.webp',
  '/uploads/watch.png': '/uploads/watches.webp',
  '/uploads/perfume.png': '/uploads/perfumes.webp',

  // Direct category / product name aliases & persistent static webp assets
  '/uploads/wallets.webp': '/uploads/wallets.webp',
  '/uploads/belts.webp': '/uploads/belts.webp',
  '/uploads/rings.webp': '/uploads/rings.webp',
  '/uploads/caps.webp': '/uploads/caps.webp',
  '/uploads/watches.webp': '/uploads/watches.webp',
  '/uploads/sunglasses.webp': '/uploads/sunglasses.webp',
  '/uploads/bracelets.webp': '/uploads/bracelets.webp',
  '/uploads/chains.webp': '/uploads/chains.webp',
  '/uploads/earrings.webp': '/uploads/earrings.webp',
  '/uploads/perfumes.webp': '/uploads/perfumes.webp',
  '/uploads/shoes.webp': '/uploads/shoes.webp',
  '/uploads/chappals.webp': '/uploads/chappals.webp',

  // Without /uploads prefix
  'carbon_wallet.png': '/uploads/wallets.webp',
  'gold_sunglasses.png': '/uploads/sunglasses.webp',
  'oud_perfume.png': '/uploads/perfumes.webp',
  'watch_chrono.png': '/uploads/watches.webp',
  'belt.png': '/uploads/belts.webp',
  'bracelet.png': '/uploads/bracelets.webp',
  'cap.png': '/uploads/caps.webp',
  'chain.png': '/uploads/chains.webp',
  'ring.png': '/uploads/rings.webp',
  'shoe.png': '/uploads/shoes.webp',
  'sunglasses.png': '/uploads/sunglasses.webp',
  'wallet.png': '/uploads/wallets.webp',
  'watch.png': '/uploads/watches.webp',
  'perfume.png': '/uploads/perfumes.webp',
  'wallets.webp': '/uploads/wallets.webp',
  'belts.webp': '/uploads/belts.webp',
  'rings.webp': '/uploads/rings.webp',
  'caps.webp': '/uploads/caps.webp',
  'watches.webp': '/uploads/watches.webp',
  'bracelets.webp': '/uploads/bracelets.webp',
  'chains.webp': '/uploads/chains.webp',
  'earrings.webp': '/uploads/earrings.webp',
  'perfumes.webp': '/uploads/perfumes.webp',
  'shoes.webp': '/uploads/shoes.webp',
  'chappals.webp': '/uploads/chappals.webp',
};

/**
 * Resolves any image path (full URL, relative path, filename, or legacy asset)
 * into a fully qualified, valid image URL.
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

  // 2. Strip existing server domain if already prefixed to normalize
  let cleanPath = trimmed;
  const baseUrl = getServerBaseUrl();
  if (cleanPath.startsWith('http://localhost:5000')) {
    cleanPath = cleanPath.replace('http://localhost:5000', '');
  } else if (cleanPath.startsWith(baseUrl)) {
    cleanPath = cleanPath.replace(baseUrl, '');
  }

  // 3. Check for seed/legacy mappings
  if (SEED_IMAGE_MAPPINGS[cleanPath]) {
    cleanPath = SEED_IMAGE_MAPPINGS[cleanPath];
  } else if (SEED_IMAGE_MAPPINGS[`/uploads/${cleanPath}`]) {
    cleanPath = SEED_IMAGE_MAPPINGS[`/uploads/${cleanPath}`];
  }

  // 4. If it's already an external absolute URL (e.g. Cloudinary / S3 / CDN)
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }

  // 5. Ensure path starts with a single slash
  if (!cleanPath.startsWith('/')) {
    cleanPath = cleanPath.startsWith('uploads/') ? `/${cleanPath}` : `/uploads/${cleanPath}`;
  }

  return `${baseUrl}${cleanPath}`;
};

export default resolveImage;
