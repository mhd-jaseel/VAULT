import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Route imports
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import discountRoutes from './routes/discountRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import returnRoutes from './routes/returnRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import adminManagementRoutes from './routes/adminManagementRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import shippingSettingsRoutes from './routes/shippingSettingsRoutes.js';
import aboutRoutes from './routes/aboutRoutes.js';
import Product from './models/Product.js';
import Category from './models/Category.js';

import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Trust reverse proxy (e.g. Render, Vercel, AWS) for accurate client IP resolution in rate limiters
app.set('trust proxy', 1);

// Configure ESM paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Allowed CORS origins list
const defaultAllowedOrigins = [
  'https://vaultco.online',
  'https://www.vaultco.online',
  'https://vaultco.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
];

const envOrigins = [process.env.FRONTEND_URL, process.env.CLIENT_URL, process.env.CORS_ORIGIN]
  .filter(Boolean)
  .flatMap((urls) => urls.split(','))
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envOrigins])];

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  })
);

// IMPORTANT: Raw body parser for Razorpay webhook — must be BEFORE express.json()
// Razorpay webhook signature verification requires the raw request body buffer.
app.use('/api/payments/razorpay/webhook', express.raw({ type: '*/*' }));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// Serve Static Uploads with safe Cache-Control
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d',
    immutable: false,
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);

// Routes API Mapping
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/shipping-settings', shippingSettingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api', campaignRoutes);
app.use('/api', brandRoutes);
app.use('/api', couponRoutes);
app.use('/api', discountRoutes);
app.use('/api/announcement', announcementRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/admin-management', adminManagementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/about', aboutRoutes);

// Sitemap and Robots.txt
app.get('/sitemap.xml', async (req, res) => {
  try {
    const products = await Product.find({}).select('_id updatedAt').lean();
    const categories = await Category.find({}).select('_id updatedAt').lean();

    const baseUrl = (process.env.FRONTEND_URL || '').split(',')[0].trim().replace(/\/+$/, '') || 'https://vaultco.online';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // 1. Core Public Indexable Static Pages
    xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${baseUrl}/shop</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${baseUrl}/about</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${baseUrl}/terms</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${baseUrl}/privacy</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;

    // 2. Dynamic Product Pages (Only indexable public products)
    products.forEach((p) => {
      const lastModDate = (p.updatedAt || new Date()).toISOString().split('T')[0];
      xml += `  <url>\n    <loc>${baseUrl}/product/${p._id}</loc>\n    <lastmod>${lastModDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    // 3. Dynamic Category Pages
    categories.forEach((c) => {
      xml += `  <url>\n    <loc>${baseUrl}/shop?category=${c._id}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600');
    res.status(200).send(xml);
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
});

app.get('/robots.txt', (req, res) => {
  const domain = (process.env.FRONTEND_URL || '').split(',')[0].trim().replace(/\/+$/, '') || 'https://vaultco.online';
  const robots = [
    'User-agent: *',
    'Allow: /',
    'Allow: /shop',
    'Allow: /product/',
    'Allow: /about',
    'Allow: /terms',
    'Allow: /privacy',
    'Disallow: /admin',
    'Disallow: /admin/*',
    'Disallow: /checkout',
    'Disallow: /cart',
    'Disallow: /profile',
    'Disallow: /wishlist',
    'Disallow: /my-returns',
    'Disallow: /my-wallet',
    'Disallow: /returns/',
    'Disallow: /order-tracking/',
    'Disallow: /order-success/',
    'Disallow: /login',
    'Disallow: /blocked',
    'Disallow: /api/',
    '',
    `Sitemap: ${domain}/sitemap.xml`,
  ].join('\n');

  res.header('Content-Type', 'text/plain');
  res.header('Cache-Control', 'public, max-age=86400');
  res.send(robots);
});

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'VAULT Premium Accessories API is running.' });
});

// 404 handler for unmatched API routes
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

export default app;
