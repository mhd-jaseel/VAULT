import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from './models/Product.js';
import Category from './models/Category.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');
const artifactsDir = 'C:\\Users\\HP ZBook Power G7\\.gemini\\antigravity-ide\\brain\\5bdc9889-61cb-4380-8250-d668f2dfe962';

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vault';

const run = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB.');

    // 1. Copy generated images from artifacts folder to uploads folder
    const generatedImageMaps = {
      'wallet_angle1.webp': 'wallet_angle1_1786033777369.png',
      'wallet_angle2.webp': 'wallet_angle2_1786033791236.png',
      'wallet_angle3.webp': 'wallet_angle3_1786033805883.png',
      'perfume_angle1.webp': 'perfume_angle1_1786033880275.png',
      'perfume_angle2.webp': 'perfume_angle2_1786033896494.png',
      'perfume_angle3.webp': 'perfume_angle3_1786033910096.png',
      'sunglasses_angle1.webp': 'sunglasses_angle1_1786033956969.png',
      'sunglasses_angle2.webp': 'sunglasses_angle2_1786033971877.png',
      'sunglasses_angle3.webp': 'sunglasses_angle3_1786033991656.png',
      'watch_angle1.webp': 'watch_angle1_1786034004242.png',
      'watch_angle2.webp': 'watch_angle2_1786034024025.png',
      'watch_angle3.webp': 'watch_angle3_1786034037906.png',
      'belt_angle1.webp': 'belt_angle1_1786034063248.png',
    };

    Object.entries(generatedImageMaps).forEach(([dest, src]) => {
      const srcPath = path.join(artifactsDir, src);
      const destPath = path.join(uploadsDir, dest);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${src} to ${dest}`);
      }
    });

    // 2. Setup 3 angles for all categories using fallback to clean files if not generated
    const categories = await Category.find({});
    for (const cat of categories) {
      const prefix = cat.name.toLowerCase();
      for (let i = 1; i <= 3; i++) {
        const destFileName = `${prefix}_angle${i}.webp`;
        const destPath = path.join(uploadsDir, destFileName);

        if (!fs.existsSync(destPath)) {
          let srcFileName = `${prefix}_angle${i}.webp`;
          if (prefix === 'shades') {
            srcFileName = `sunglasses_angle${i}.webp`;
          } else if (prefix === 'rings') {
            srcFileName = `rings_clean.webp`;
          } else if (prefix === 'belts' && i > 1) {
            srcFileName = `belts_clean.webp`;
          } else {
            srcFileName = `${prefix}_clean.webp`;
            if (!fs.existsSync(path.join(uploadsDir, srcFileName))) {
              srcFileName = `${prefix}.webp`;
            }
          }

          const srcPath = path.join(uploadsDir, srcFileName);
          if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`Fallback: Copied ${srcFileName} to ${destFileName}`);
          }
        }
      }
    }

    // 3. Update all products in MongoDB to have these 3 category angles
    const products = await Product.find({}).populate('category');
    for (const prod of products) {
      if (prod.category) {
        const catPrefix = prod.category.name.toLowerCase();
        prod.images = [
          `/uploads/${catPrefix}_angle1.webp`,
          `/uploads/${catPrefix}_angle2.webp`,
          `/uploads/${catPrefix}_angle3.webp`,
        ];
        await prod.save();
        console.log(`Updated product: ${prod.name} with 3 images.`);
      }
    }

    // 4. Delete old legacy single product images from uploads folder
    const oldFiles = [
      'carbon_wallet.png',
      'gold_sunglasses.png',
      'oud_perfume.png',
      'watch_chrono.png',
    ];
    oldFiles.forEach((file) => {
      const filePath = path.join(uploadsDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted legacy file: ${file}`);
      }
    });

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

run();
