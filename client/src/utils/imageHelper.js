export const resolveImage = (url) => {
  if (!url) return '';
  const mappings = {
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
  };

  const cleanUrl = url.replace('http://localhost:5000', '');
  const mapped = mappings[cleanUrl];
  const finalPath = mapped || cleanUrl;
  return finalPath.startsWith('/') ? `http://localhost:5000${finalPath}` : finalPath;
};
