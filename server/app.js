import express from 'express';
import cors from 'cors';
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

// Models for sitemap
import Product from './models/Product.js';
import Category from './models/Category.js';

const app = express();

// Configure ESM paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
// IMPORTANT: Raw body parser for Razorpay webhook — must be BEFORE express.json()
// Razorpay webhook signature verification requires the raw request body buffer.
app.use('/api/payments/razorpay/webhook', express.raw({ type: '*/*' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes API Mapping
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingsRoutes);
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

// Sitemap and Robots.txt
app.get('/sitemap.xml', async (req, res) => {
  try {
    const products = await Product.find({}).select('_id updatedAt');
    const categories = await Category.find({}).select('_id updatedAt');

    const baseUrl = 'http://localhost:5173'; // Frontend base URL

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add static pages
    xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${baseUrl}/shop</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${baseUrl}/about</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;

    // Add products
    products.forEach(p => {
      xml += `  <url>\n    <loc>${baseUrl}/product/${p._id}</loc>\n    <lastmod>${(p.updatedAt || new Date()).toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    // Add categories
    categories.forEach(c => {
      xml += `  <url>\n    <loc>${baseUrl}/shop?category=${c._id}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
});

app.get('/robots.txt', (req, res) => {
  const robots = `User-agent: *\nAllow: /\nSitemap: http://localhost:5000/sitemap.xml`;
  res.header('Content-Type', 'text/plain');
  res.send(robots);
});

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'VAULT Premium Accessories API is running.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
