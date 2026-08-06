import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import Category from './models/Category.js';
import Product from './models/Product.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vault';
const uploadsDir = path.join(process.cwd(), 'uploads');

// Map categories to their generated image files
const categoryImages = {
  'WATCHES': 'category_watches_1786013092958.png',
  'EARRINGS': 'category_earrings_1786013107287.png',
  'BELTS': 'category_belts_1786013117912.png',
  'CHAPPALS': 'category_chappals_1786013131968.png',
  'SHADES': 'category_shades_1786013145787.png',
  'CAPS': 'category_caps_1786013159276.png',
  'RINGS': 'category_rings_1786013272794.png',
  'BRACELETS': 'category_bracelets_1786013284390.png',
  'CHAINS': 'category_chains_1786013298802.png',
  'SHOES': 'category_shoes_1786013312111.png',
  'WALLETS': 'category_wallets_1786013326221.png',
  'PERFUMES': 'category_perfumes_1786013338226.png',
  'SUNGLASSES': 'category_sunglasses_1786013350174.png',
  'NECKLACES': 'category_chains_1786013298802.png', // Reusing the chain image
};

const oldImageFiles = [
  'belt-transparent.webp', 'belt.png',
  'bracelet-transparent.webp', 'bracelet.png',
  'cap-transparent.webp', 'cap.png',
  'chain-transparent.webp', 'chain.png',
  'perfume-transparent.webp', 'perfume.png',
  'ring-transparent.webp', 'ring.png',
  'shoe-transparent.webp', 'shoe.png',
  'sunglasses-transparent.webp', 'sunglasses.png',
  'wallet-transparent.webp', 'wallet.png',
  'watch-transparent.webp', 'watch.png'
];

async function migrate() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB.');

    // 1. Delete old category image files from server/uploads/
    console.log('Deleting old category image files from uploads...');
    for (const filename of oldImageFiles) {
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old asset: ${filename}`);
      }
    }

    // 2. Convert new generated images to optimized WebP format
    console.log('Processing and converting new category images to WebP...');
    const srcDir = 'C:\\Users\\HP ZBook Power G7\\.gemini\\antigravity-ide\\brain\\5bdc9889-61cb-4380-8250-d668f2dfe962';
    
    const newCategoryData = [];

    for (const [catName, srcFilename] of Object.entries(categoryImages)) {
      const srcPath = path.join(srcDir, srcFilename);
      const destFilename = `${catName.toLowerCase()}.webp`;
      const destPath = path.join(uploadsDir, destFilename);

      if (fs.existsSync(srcPath)) {
        console.log(`Processing ${srcFilename} -> ${destFilename}...`);
        await sharp(srcPath)
          .resize(1024, 1024, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .webp({ quality: 85 })
          .toFile(destPath);
        
        newCategoryData.push({
          name: catName,
          image: `/uploads/${destFilename}`,
          description: `Premium luxury curated ${catName.toLowerCase()}`
        });
      } else {
        console.warn(`Source image not found for category ${catName}: ${srcPath}`);
      }
    }

    // 3. Keep a mapping of old category names to their ID maps to migrate products
    const oldCategories = await Category.find({});
    const oldCatMap = {}; // name.toLowerCase() -> id
    oldCategories.forEach(c => {
      oldCatMap[c.name.toLowerCase()] = c._id.toString();
    });

    // 4. Clear existing Categories
    console.log('Clearing Category collection...');
    await Category.deleteMany({});

    // 5. Insert new Categories
    console.log('Inserting rebranded categories...');
    const insertedCategories = [];
    for (const cat of newCategoryData) {
      const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const newCat = await Category.create({
        name: cat.name,
        slug,
        description: cat.description,
        image: cat.image
      });
      insertedCategories.push(newCat);
      console.log(`Created Category: ${newCat.name}`);
    }

    // Map new category names to their new IDs
    const newCatMap = {}; // name.toLowerCase() -> id
    insertedCategories.forEach(c => {
      newCatMap[c.name.toLowerCase()] = c._id;
    });

    // 6. Migrate existing products to their new categories
    console.log('Updating existing products to associate with rebranded categories...');
    const products = await Product.find({});
    let updatedCount = 0;

    for (const prod of products) {
      // Find the name of the product's old category
      const oldCatIdStr = prod.category?.toString();
      const oldCatName = Object.keys(oldCatMap).find(key => oldCatMap[key] === oldCatIdStr);

      if (oldCatName) {
        // Find corresponding new category ID
        const newCatId = newCatMap[oldCatName];
        if (newCatId) {
          prod.category = newCatId;
          await prod.save();
          updatedCount++;
        }
      } else {
        // Fallback matching by description or matching product properties if needed,
        // or match if product category is undefined/null.
        // Let's try to match by keywords in name or description
        const prodNameLower = prod.name.toLowerCase();
        let matchedCatId = null;

        for (const catName of Object.keys(newCatMap)) {
          // If product name contains category name (e.g. "wallet" in "Bifold Saffiano Wallet")
          // Singularize/match
          const singular = catName.endsWith('s') ? catName.slice(0, -1) : catName;
          if (prodNameLower.includes(singular)) {
            matchedCatId = newCatMap[catName];
            break;
          }
        }

        if (matchedCatId) {
          prod.category = matchedCatId;
          await prod.save();
          updatedCount++;
        }
      }
    }

    console.log(`Successfully migrated ${updatedCount} products to rebranded categories.`);
    console.log('Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
