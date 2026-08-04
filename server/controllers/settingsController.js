import Setting from '../models/Setting.js';

export const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      // Return default values if setting not initialized yet
      settings = await Setting.create({
        storeName: 'VAULT',
        phoneNumber: '+919999999999',
        whatsappNumber: '919999999999',
        upiId: 'vault@upi',
        shippingCharges: 100,
        freeShippingMinAmount: 1500,
      });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting({});
    }

    const {
      storeName,
      phoneNumber,
      whatsappNumber,
      upiId,
      shippingCharges,
      freeShippingMinAmount,
      heroTitle,
      heroSubtitle,
      heroDescription,
      heroProductName,
      heroProductPrice,
    } = req.body;

    settings.storeName = storeName || settings.storeName;
    settings.phoneNumber = phoneNumber || settings.phoneNumber;
    settings.whatsappNumber = whatsappNumber || settings.whatsappNumber;
    settings.upiId = upiId || settings.upiId;
    if (shippingCharges !== undefined) settings.shippingCharges = Number(shippingCharges);
    if (freeShippingMinAmount !== undefined) settings.freeShippingMinAmount = Number(freeShippingMinAmount);

    if (heroTitle !== undefined) settings.heroTitle = heroTitle;
    if (heroSubtitle !== undefined) settings.heroSubtitle = heroSubtitle;
    if (heroDescription !== undefined) settings.heroDescription = heroDescription;
    if (heroProductName !== undefined) settings.heroProductName = heroProductName;
    if (heroProductPrice !== undefined) settings.heroProductPrice = Number(heroProductPrice);

    // Handle logo and QR code file uploads
    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        settings.logo = `/uploads/${req.files.logo[0].filename}`;
      }
      if (req.files.upiQrCode && req.files.upiQrCode[0]) {
        settings.upiQrCode = `/uploads/${req.files.upiQrCode[0].filename}`;
      }
      if (req.files.heroImage && req.files.heroImage[0]) {
        settings.heroImage = `/uploads/${req.files.heroImage[0].filename}`;
      }
    }

    const updatedSettings = await settings.save();
    res.json({ success: true, data: updatedSettings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
