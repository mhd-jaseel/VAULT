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
      { name: 'Wallets', description: 'Structured bifold wallets and minimalist cardholders.', image: '/uploads/wallets.webp' },
      { name: 'Sunglasses', description: 'Signature polarised aviators and acetate frames.', image: '/uploads/sunglasses.webp' },
      { name: 'Watches', description: 'Masterfully engineered chronographs and automatics.', image: '/uploads/watches.webp' },
      { name: 'Belts', description: 'Handcrafted premium leather belts with brushed buckles.', image: '/uploads/belts.webp' },
      { name: 'Caps', description: 'Minimalist luxury accessories for high end street styles.', image: '/uploads/caps.webp' },
      { name: 'Bracelets', description: 'Artisanal metal accents and minimal wrist wear.', image: '/uploads/bracelets.webp' },
      { name: 'Chains', description: 'Statement silver and gold necklaces with premium link styles.', image: '/uploads/chains.webp' },
      { name: 'Rings', description: 'Polished silver bands and modern statement rings.', image: '/uploads/rings.webp' },
      { name: 'Earrings', description: 'Statement metal earrings crafted with luxury precision.', image: '/uploads/earrings.webp' },
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
      // Sunglasses
      {
        name: 'Aviator Gold Sunglasses',
        description: 'Signature gold-plated aviator frames with polarisation-coated gradient lenses. Provides 100% UV protection.',
        price: 5999,
        category: categoryMap['Sunglasses'],
        brand: brandMap['VAULT'],
        stock: 12,
        images: ['/uploads/sunglasses.webp'],
        isFeatured: true,
      },
      {
        name: 'Classic Black Acetate Sunglasses',
        description: 'Premium acetate frames with polarized dark lenses. Hand-polished details for a signature aesthetic look.',
        price: 4999,
        category: categoryMap['Sunglasses'],
        brand: brandMap['VAULT'],
        stock: 15,
        images: ['/uploads/sunglasses.webp'],
        isFeatured: false,
      },
      // Watches
      {
        name: 'Heritage Automatic 41mm',
        description: 'Automatic self-winding mechanical watch with sapphire crystal, exhibition case back, and 100m water resistance.',
        price: 24999,
        category: categoryMap['Watches'],
        brand: brandMap['Omega'],
        stock: 5,
        images: ['/uploads/watches.webp'],
        isFeatured: true,
      },
      {
        name: 'Chrono Sport Quartz Watch',
        description: 'High-precision Japanese chronograph movement with tachymeter bezel, date window, and luminous dial hands.',
        price: 12999,
        category: categoryMap['Watches'],
        brand: brandMap['VAULT'],
        stock: 18,
        images: ['/uploads/watches.webp'],
        isFeatured: true,
      },
      {
        name: 'Minimalist Steel Mesh Watch',
        description: 'Ultra-thin 38mm stainless steel case with Milanese mesh strap. Clean Bauhaus-inspired dial aesthetic.',
        price: 8499,
        category: categoryMap['Watches'],
        brand: brandMap['Aethered'],
        stock: 20,
        images: ['/uploads/watches.webp'],
        isFeatured: false,
      },
      // Belts
      {
        name: 'Full-Grain Reversible Leather Belt',
        description: 'Versatile black/cognac reversible belt in full-grain Italian leather with a rotary brushed palladium buckle.',
        price: 3999,
        category: categoryMap['Belts'],
        brand: brandMap['VAULT'],
        stock: 25,
        images: ['/uploads/belts.webp'],
        isFeatured: true,
      },
      {
        name: 'Casual Suede Belt',
        description: 'Supple split suede belt with tonal burnished edges and an antique brass buckle. Perfect for chinos and denim.',
        price: 3299,
        category: categoryMap['Belts'],
        brand: brandMap['Aethered'],
        stock: 15,
        images: ['/uploads/belts.webp'],
        isFeatured: false,
      },
      {
        name: 'Formal Dress Calfskin Belt',
        description: 'Feather-edged dress belt in polished French boxcalf leather with a minimalist nickel-free buckle.',
        price: 4499,
        category: categoryMap['Belts'],
        brand: brandMap['VAULT'],
        stock: 18,
        images: ['/uploads/belts.webp'],
        isFeatured: false,
      },
      // Caps
      {
        name: 'Signature Washed Cotton Cap',
        description: 'Low-profile 6-panel unstructured dad cap in heavyweight washed cotton twill with an engraved metal buckle strap.',
        price: 1899,
        category: categoryMap['Caps'],
        brand: brandMap['VAULT'],
        stock: 35,
        images: ['/uploads/caps.webp'],
        isFeatured: true,
      },
      {
        name: 'Wool Blend Baseball Cap',
        description: 'Structured wool-blend crown with a flat peak and snapback closure. Features subtle embroidered tonal branding.',
        price: 2499,
        category: categoryMap['Caps'],
        brand: brandMap['VAULT'],
        stock: 20,
        images: ['/uploads/caps.webp'],
        isFeatured: false,
      },
      // Bracelets
      {
        name: 'Braided Leather Anchor Bracelet',
        description: 'Double-wrap genuine leather cord with a nautical cast brass anchor clasp. Treated for water and sweat resistance.',
        price: 2199,
        category: categoryMap['Bracelets'],
        brand: brandMap['VAULT'],
        stock: 30,
        images: ['/uploads/bracelets.webp'],
        isFeatured: true,
      },
      {
        name: 'Sterling Silver Cable Cuff',
        description: 'Twisted industrial cable cuff in 925 sterling silver with engraved end caps. Adjustable for a tailored wrist fit.',
        price: 6999,
        category: categoryMap['Bracelets'],
        brand: brandMap['Aethered'],
        stock: 10,
        images: ['/uploads/bracelets.webp'],
        isFeatured: true,
      },
      // Chains
      {
        name: '5mm Figaro Chain Necklace',
        description: 'Classic 3+1 Figaro pattern link chain in solid 316L stainless steel with a high-polish rhodium finish. 22-inch length.',
        price: 3499,
        category: categoryMap['Chains'],
        brand: brandMap['VAULT'],
        stock: 22,
        images: ['/uploads/chains.webp'],
        isFeatured: true,
      },
      {
        name: 'Micro Cuban Link Chain',
        description: 'Precision-diamond-cut 3mm Cuban chain with lobster clasp. Hypoallergenic and resistant to tarnishing.',
        price: 2999,
        category: categoryMap['Chains'],
        brand: brandMap['VAULT'],
        stock: 28,
        images: ['/uploads/chains.webp'],
        isFeatured: false,
      },
      // Rings
      {
        name: 'Beveled Edge Tungsten Carbide Ring',
        description: 'Heavyweight brushed tungsten ring with polished beveled facets. Scratch-proof and hypoallergenic comfort-fit band.',
        price: 3299,
        category: categoryMap['Rings'],
        brand: brandMap['VAULT'],
        stock: 20,
        images: ['/uploads/rings.webp'],
        isFeatured: true,
      },
      {
        name: 'Black Onyx Signet Ring',
        description: 'Modern octagonal signet ring in 316L stainless steel inlaid with a genuine polished black onyx gemstone plate.',
        price: 4199,
        category: categoryMap['Rings'],
        brand: brandMap['Aethered'],
        stock: 14,
        images: ['/uploads/rings.webp'],
        isFeatured: true,
      },
      // Earrings
      {
        name: 'Polished Minimal Stud Earrings',
        description: 'Subtle high-shine stud earrings engineered from surgical-grade stainless steel for daily luxury wear.',
        price: 1999,
        category: categoryMap['Earrings'],
        brand: brandMap['VAULT'],
        stock: 18,
        images: ['/uploads/earrings.webp'],
        isFeatured: false,
      },
    ];

    for (const prod of productsData) {
      await Product.create({
        ...prod,
        slug: makeSlug(prod.name)
      });
    }
    console.log('Seeded products successfully.');

    // Seed dummy hero banners
    const bannersData = [
      {
        badgeText: 'NEW ARRIVALS EVERY WEEK',
        heading: 'UNCOMPROMISING LUXURY',
        description: 'Crafted for the modern gentleman. Discover premium leather wallets, masterfully engineered watches, and artisanal jewelry designed to last.',
        primaryButtonText: 'SHOP NOW',
        primaryButtonLink: '/shop',
        secondaryButtonText: 'VIEW BEST SELLERS',
        secondaryButtonLink: '/shop?featured=true',
        imageUrl: '/uploads/watches.webp',
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
        desktopImageUrl: '/uploads/wallets.webp',
        mobileImageUrl: '/uploads/wallets.webp',
        featuredProductName: 'Saffiano Bifold Wallet',
        featuredProductPrice: 3499,
        featuredProductTag: 'POPULAR CHOICE',
        sortOrder: 2,
        isActive: true,
      },
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
