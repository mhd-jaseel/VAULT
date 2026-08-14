import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './models/Category.js';
import Product from './models/Product.js';
import Setting from './models/Setting.js';
import Campaign from './models/Campaign.js';
import Brand from './models/Brand.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vault';

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB.');

    // Clear existing categories, products, settings, brands, and campaigns
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Setting.deleteMany({});
    await Campaign.deleteMany({});
    await Brand.deleteMany({});
    console.log('Cleared existing categories, products, settings, brands, and campaigns.');

    // Seed default settings
    await Setting.create({
      storeName: 'VAULT',
      phoneNumber: '+919999999999',
      whatsappNumber: '919999999999',
      upiId: 'vault@upi',
      shippingCharges: 100,
      freeShippingMinAmount: 1500,
      heroTitle: 'UNCOMPROMISING LUXURY',
      heroSubtitle: 'NEW ARRIVALS EVERY WEEK',
      heroDescription: 'Crafted for the modern gentleman. Discover premium leather wallets, masterfully engineered watches, and artisanal jewelry designed to last.',
      heroImage: '/uploads/watch_chrono.png',
      heroProductName: 'Vault Precision Chrono',
      heroProductPrice: 14999,
    });
    console.log('Seeded store configuration successfully.');

    // Helper function to create slug
    const makeSlug = (name) => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    };

    // Seed Brands
    const brandData = [
      { name: 'VAULT', isActive: true },
      { name: 'Aethered', isActive: true },
      { name: 'Omega', isActive: true },
    ];

    const seededBrands = [];
    for (const b of brandData) {
      const newBrand = await Brand.create({
        ...b,
        slug: makeSlug(b.name)
      });
      seededBrands.push(newBrand);
    }
    console.log('Seeded brands successfully.');

    const brandMap = {};
    seededBrands.forEach((b) => {
      brandMap[b.name] = b._id;
    });

    const categoriesData = [
      { name: 'Wallets', description: 'Structured bifold wallets and minimalist cardholders.', image: '/uploads/wallet.png' },
      { name: 'Perfumes', description: 'Magnetising scents, oud extraits, and fresh parfums.', image: '/uploads/perfume.png' },
      { name: 'Sunglasses', description: 'Signature polarised aviators and acetate frames.', image: '/uploads/sunglasses.png' },
      { name: 'Watches', description: 'Masterfully engineered chronographs and automatics.', image: '/uploads/watch.png' },
      { name: 'Belts', description: 'Handcrafted premium leather belts with brushed buckles.', image: '/uploads/belt.png' },
      { name: 'Caps', description: 'Minimalist luxury accessories for high end street styles.', image: '/uploads/cap.png' },
      { name: 'Bracelets', description: 'Artisanal metal accents and minimal wrist wear.', image: '/uploads/bracelet.png' },
      { name: 'Chains', description: 'Statement silver and gold necklaces with premium link styles.', image: '/uploads/chain.png' },
      { name: 'Rings', description: 'Polished silver bands and modern statement rings.', image: '/uploads/ring.png' },
      { name: 'Shoes', description: 'Tailored casual sneakers and handcrafted leather loafers.', image: '/uploads/shoe.png' },
    ];

    const seededCategories = [];
    for (const cat of categoriesData) {
      const newCat = await Category.create({
        ...cat,
        slug: makeSlug(cat.name)
      });
      seededCategories.push(newCat);
    }
    console.log('Seeded categories successfully.');

    const categoryMap = {};
    seededCategories.forEach((cat) => {
      categoryMap[cat.name] = cat._id;
    });

    // Seed Products (20 pieces across categories)
    const productsData = [
      // Wallets
      {
        name: 'Bifold Saffiano Wallet',
        description: 'Structured bifold wallet in cross-grain Saffiano leather. Designed with 8 card slots, dual bill compartments, and RFID blocking lining.',
        price: 3499,
        category: categoryMap['Wallets'],
        brand: brandMap['VAULT'],
        stock: 25,
        images: ['/uploads/carbon_wallet.png'],
        isFeatured: true,
      },
      {
        name: 'Minimalist Carbon Cardholder',
        description: 'Ultra-sleek carbon fiber cardholder with a spring-loaded quick access mechanism. Fits up to 6 cards comfortably.',
        price: 2499,
        category: categoryMap['Wallets'],
        brand: brandMap['VAULT'],
        stock: 30,
        images: ['/uploads/carbon_wallet.png'],
        isFeatured: false,
      },
      // Perfumes
      {
        name: 'Oud Perfume Bottle',
        description: 'A complex and magnetic blend of precious Cambodian oud, damask rose, warm amber, and hints of spiced cardamom. High concentration parfum.',
        price: 8999,
        category: categoryMap['Perfumes'],
        brand: brandMap['VAULT'],
        stock: 10,
        images: ['/uploads/oud_perfume.png'],
        isFeatured: true,
      },
      {
        name: 'Noir Absolute Extrait',
        description: 'A dark, smoky scent profile with notes of leather, cedar wood, black pepper, and premium vanilla. Long lasting luxury projection.',
        price: 9999,
        category: categoryMap['Perfumes'],
        brand: brandMap['Aethered'],
        stock: 12,
        images: ['/uploads/oud_perfume.png'],
        isFeatured: true,
      },
      // Sunglasses
      {
        name: 'Aviator Gold Sunglasses',
        description: 'Signature gold-plated aviator frames with polarisation-coated gradient lenses. Provides 100% UV protection.',
        price: 5999,
        category: categoryMap['Sunglasses'],
        brand: brandMap['VAULT'],
        stock: 12,
        images: ['/uploads/gold_sunglasses.png'],
        isFeatured: true,
      },
      {
        name: 'Classic Black Acetate Sunglasses',
        description: 'Premium acetate frames with polarized dark lenses. Hand-polished details for a signature aesthetic look.',
        price: 4999,
        category: categoryMap['Sunglasses'],
        brand: brandMap['VAULT'],
        stock: 15,
        images: ['/uploads/gold_sunglasses.png'],
        isFeatured: false,
      },
      // Watches
      {
        name: 'Classic Leather Chrono',
        description: 'Masterfully engineered chronograph watch featuring a genuine calfskin leather strap, scratch-resistant sapphire crystal glass, and Japanese quartz movement.',
        price: 12999,
        category: categoryMap['Watches'],
        brand: brandMap['VAULT'],
        stock: 15,
        images: ['/uploads/watch_chrono.png'],
        isFeatured: true,
      },
      {
        name: 'Titanium Stealth Automatic',
        description: 'Matte black titanium grade 5 case paired with a mechanical automatic movement. Water-resistant up to 100m, designed for durability.',
        price: 24999,
        category: categoryMap['Watches'],
        brand: brandMap['VAULT'],
        stock: 8,
        images: ['/uploads/watch_chrono.png'],
        isFeatured: true,
      },
      {
        name: 'Monaco Vintage Automatic',
        description: 'Retro-inspired steel chronometer featuring high precision automatic movement and a sapphire display caseback.',
        price: 34999,
        category: categoryMap['Watches'],
        brand: brandMap['Omega'],
        stock: 5,
        images: ['/uploads/watch_chrono.png'],
        isFeatured: false,
      },
      // Belts
      {
        name: 'Premium Suede Leather Belt',
        description: 'Soft genuine Italian suede belt with modern silver buckle details. Handcrafted and tailored for luxury style.',
        price: 3999,
        category: categoryMap['Belts'],
        brand: brandMap['VAULT'],
        stock: 20,
        images: ['/uploads/carbon_wallet.png'],
        isFeatured: false,
      },
      {
        name: 'Brushed Buckle Leather Belt',
        description: 'Full-grain calfskin leather belt with a custom brushed metal buckle. Timeless premium design.',
        price: 4499,
        category: categoryMap['Belts'],
        brand: brandMap['VAULT'],
        stock: 18,
        images: ['/uploads/carbon_wallet.png'],
        isFeatured: true,
      },
      // Caps
      {
        name: 'Classic Luxury Cap',
        description: 'Minimalist designer cap in premium cotton twill with an adjustable metal clasp and subtle brand branding.',
        price: 2999,
        category: categoryMap['Caps'],
        brand: brandMap['VAULT'],
        stock: 25,
        images: ['/uploads/carbon_wallet.png'],
        isFeatured: false,
      },
      // Bracelets
      {
        name: 'Silver Cuff Bracelet',
        description: 'Sleek brushed silver metal cuff featuring debossed geometric patterns. High quality, non-tarnish premium finish.',
        price: 3499,
        category: categoryMap['Bracelets'],
        brand: brandMap['VAULT'],
        stock: 30,
        images: ['/uploads/watch_chrono.png'],
        isFeatured: true,
      },
      {
        name: 'Minimal Braided Leather Wristlet',
        description: 'Double loop hand-braided leather bracelet secured by a custom magnetic lock mechanism.',
        price: 2499,
        category: categoryMap['Bracelets'],
        brand: brandMap['VAULT'],
        stock: 40,
        images: ['/uploads/watch_chrono.png'],
        isFeatured: false,
      },
      // Chains
      {
        name: 'Cuban Link Silver Chain',
        description: 'Premium sterling silver Cuban link chain. 20 inches in length, featuring high polish shine and lobster clasp lock.',
        price: 7999,
        category: categoryMap['Chains'],
        brand: brandMap['VAULT'],
        stock: 15,
        images: ['/uploads/watch_chrono.png'],
        isFeatured: true,
      },
      {
        name: 'Minimalist Cable Chain Gold',
        description: 'Elegant 18k gold-plated cable chain, designed for everyday subtle luxury wear.',
        price: 6999,
        category: categoryMap['Chains'],
        brand: brandMap['VAULT'],
        stock: 10,
        images: ['/uploads/watch_chrono.png'],
        isFeatured: false,
      },
      // Rings
      {
        name: 'Polished Titanium Band',
        description: 'Extremely durable matte-finished titanium ring band with a polished interior for maximum comfort.',
        price: 2999,
        category: categoryMap['Rings'],
        brand: brandMap['VAULT'],
        stock: 35,
        images: ['/uploads/watch_chrono.png'],
        isFeatured: true,
      },
      {
        name: 'Sterling Silver Signet Ring',
        description: 'Classic signet ring style crafted in solid sterling silver, hand-polished to a clean mirror finish.',
        price: 3999,
        category: categoryMap['Rings'],
        brand: brandMap['VAULT'],
        stock: 20,
        images: ['/uploads/watch_chrono.png'],
        isFeatured: false,
      },
      // Shoes
      {
        name: 'Vanguard Leather Loafers',
        description: 'Artisanal Italian calfskin leather loafers, featuring hand-stitched detailing and high traction rubber soles.',
        price: 14999,
        category: categoryMap['Shoes'],
        brand: brandMap['VAULT'],
        stock: 8,
        images: ['/uploads/carbon_wallet.png'],
        isFeatured: true,
      },
      {
        name: 'Urban Luxe Minimal Sneakers',
        description: 'Sleek low-top white leather sneakers with soft inner lining and premium cupsole construction.',
        price: 9999,
        category: categoryMap['Shoes'],
        brand: brandMap['VAULT'],
        stock: 14,
        images: ['/uploads/carbon_wallet.png'],
        isFeatured: true,
      }
    ];

    for (const prod of productsData) {
      await Product.create({
        ...prod,
        slug: makeSlug(prod.name)
      });
    }
    console.log('Seeded products successfully.');

    // Seed 3 dummy hero banners
    const bannersData = [
      {
        badgeText: 'NEW ARRIVALS EVERY WEEK',
        heading: 'UNCOMPROMISING LUXURY',
        description: 'Crafted for the modern gentleman. Discover premium leather wallets, masterfully engineered watches, and artisanal jewelry designed to last.',
        primaryButtonText: 'SHOP NOW',
        primaryButtonLink: '/shop',
        secondaryButtonText: 'VIEW BEST SELLERS',
        secondaryButtonLink: '/shop?featured=true',
        imageUrl: '/uploads/watch_chrono.png',
        imageAlt: 'Luxury Leather Chronograph watch representation',
        featuredLabel: 'FEATURED COLLECTIBLE',
        featuredTitle: 'Vault Precision Chrono',
        featuredPrice: 14999,
        order: 1,
        isActive: true,
      },
      {
        label: 'MINIMALIST DESIGN',
        title: 'ENGINEERED STRENGTH',
        description: 'Upgrade your everyday carry with carbon fiber wallets. Structured cardholders crafted with RFID blocking technology and quick card access.',
        ctaText: 'EXPLORE WALLETS',
        ctaLink: '/shop',
        desktopImageUrl: '/uploads/carbon_wallet.png',
        mobileImageUrl: '/uploads/carbon_wallet.png',
        featuredProductName: 'Saffiano Bifold Wallet',
        featuredProductPrice: 3499,
        featuredProductTag: 'POPULAR CHOICE',
        sortOrder: 2,
        isActive: true,
      },
      {
        label: 'SIGNATURE SCENTS',
        title: 'MAGNETIC INFLUENCE',
        description: 'Discover olfactory luxury with our high-concentration extrait de parfums. Infused with precious Cambodian oud, damask rose, and cardamom.',
        ctaText: 'DISCOVER FRAGRANCES',
        ctaLink: '/shop',
        desktopImageUrl: '/uploads/oud_perfume.png',
        mobileImageUrl: '/uploads/oud_perfume.png',
        featuredProductName: 'Oud Perfume Bottle',
        featuredProductPrice: 8999,
        featuredProductTag: 'BEST SELLER',
        sortOrder: 3,
        isActive: true,
      }
    ];

    await Campaign.insertMany(bannersData);
    console.log('Seeded campaigns successfully.');

    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
