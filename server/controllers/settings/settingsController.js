import Setting from '../../models/Setting.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../services/cloudinaryService.js';

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
        handlingCharge: 0,
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
      settings = new Setting();
    }

    const {
      storeName,
      phoneNumber,
      whatsappNumber,
      upiId,
      shippingCharges,
      freeShippingMinAmount,
      handlingCharge,
      adminNotificationEmail,
      socialLinks,
      heroProductName,
      heroProductPrice,
      showDiscountsOnHomepage,
      discountProductsDisplayOrder,
    } = req.body;

    if (storeName !== undefined) settings.storeName = storeName;
    if (phoneNumber !== undefined) settings.phoneNumber = phoneNumber;
    if (whatsappNumber !== undefined) settings.whatsappNumber = whatsappNumber;
    if (upiId !== undefined) settings.upiId = upiId;
    if (shippingCharges !== undefined) settings.shippingCharges = Number(shippingCharges);
    if (freeShippingMinAmount !== undefined) settings.freeShippingMinAmount = Number(freeShippingMinAmount);
    if (handlingCharge !== undefined) settings.handlingCharge = Number(handlingCharge);
    if (adminNotificationEmail !== undefined) settings.adminNotificationEmail = adminNotificationEmail;
    
    if (socialLinks !== undefined) {
      settings.socialLinks = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
    }

    if (heroProductName !== undefined) settings.heroProductName = heroProductName;
    if (heroProductPrice !== undefined) settings.heroProductPrice = Number(heroProductPrice);

    if (showDiscountsOnHomepage !== undefined) {
      settings.showDiscountsOnHomepage = showDiscountsOnHomepage === 'true' || showDiscountsOnHomepage === true;
    }
    if (discountProductsDisplayOrder !== undefined) {
      settings.discountProductsDisplayOrder = discountProductsDisplayOrder;
    }

    // Handle logo, QR code, and hero image file uploads via Cloudinary
    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        const oldLogo = settings.logo;
        settings.logo = await uploadToCloudinary(
          req.files.logo[0].path || req.files.logo[0].filename,
          'vault/settings'
        );
        if (oldLogo && oldLogo !== settings.logo) {
          await deleteFromCloudinary(oldLogo);
        }
      }
      if (req.files.upiQrCode && req.files.upiQrCode[0]) {
        const oldQr = settings.upiQrCode;
        settings.upiQrCode = await uploadToCloudinary(
          req.files.upiQrCode[0].path || req.files.upiQrCode[0].filename,
          'vault/settings'
        );
        if (oldQr && oldQr !== settings.upiQrCode) {
          await deleteFromCloudinary(oldQr);
        }
      }
      if (req.files.heroImage && req.files.heroImage[0]) {
        const oldHero = settings.heroImage;
        settings.heroImage = await uploadToCloudinary(
          req.files.heroImage[0].path || req.files.heroImage[0].filename,
          'vault/settings'
        );
        if (oldHero && oldHero !== settings.heroImage) {
          await deleteFromCloudinary(oldHero);
        }
      }
    }

    const updatedSettings = await settings.save();
    res.json({ success: true, data: updatedSettings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
