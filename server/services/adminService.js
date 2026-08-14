import User from '../models/User.js';
import Setting from '../models/Setting.js';
import AboutPage from '../models/AboutPage.js';
import { DEFAULT_ABOUT_DATA } from '../controllers/about/aboutController.js';

export const seedDefaultAdminAndSettings = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'vault.co.6235@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminVault123!';

    // Seed default admin
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await User.create({
        name: 'VAULT Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        phone: '+919999999999',
        address: {
          street: 'Admin Office',
          city: 'Mumbai',
          state: 'Maharashtra',
          zip: '400001',
          country: 'India',
        },
      });
      console.log('Default Admin Account Created Successfully.');
    } else {
      console.log('Admin Account already exists.');
    }

    // Seed default store settings
    const settingsCount = await Setting.countDocuments();
    if (settingsCount === 0) {
      await Setting.create({
        storeName: 'VAULT',
        phoneNumber: '+919999999999',
        whatsappNumber: '919999999999',
        upiId: 'vault@upi',
        shippingCharges: 100,
        freeShippingMinAmount: 1500,
      });
      console.log('Default Store Settings Seeded Successfully.');
    }

    // Seed default About Page
    const aboutCount = await AboutPage.countDocuments();
    if (aboutCount === 0) {
      await AboutPage.create(DEFAULT_ABOUT_DATA);
      console.log('Default About Page Content Seeded Successfully.');
    }
  } catch (error) {
    console.error('Error seeding default data:', error.message);
  }
};

