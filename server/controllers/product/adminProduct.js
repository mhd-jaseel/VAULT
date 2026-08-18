import Product from '../../models/Product.js';
import { deleteImageFiles } from './productHelper.js';
import { uploadToCloudinary } from '../../services/cloudinaryService.js';

// Create product (Admin only)
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      brand,
      brandId,
      stock,
      stockQty,
      countInStock,
      isFeatured,
      discountType,
      discountValue,
    } = req.body;
    const images = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadedUrl = await uploadToCloudinary(file.path || file.filename, 'vault/products');
        if (uploadedUrl) {
          images.push(uploadedUrl);
        }
      }
    }

    const selectedBrand = brand || brandId;
    const resolvedStock = stock !== undefined ? stock : (stockQty !== undefined ? stockQty : countInStock);

    const parsedPrice = Number(price);
    const parsedDiscountValue = Number(discountValue) || 0;
    const resolvedDiscountType =
      discountType && ['percentage', 'fixed'].includes(discountType) && parsedDiscountValue > 0
        ? discountType
        : null;

    if (resolvedDiscountType === 'percentage' && parsedDiscountValue > 100) {
      return res.status(400).json({ success: false, message: 'Percentage discount cannot exceed 100%.' });
    }
    if (resolvedDiscountType === 'fixed' && parsedDiscountValue > parsedPrice) {
      return res.status(400).json({ success: false, message: 'Fixed discount amount cannot exceed product price.' });
    }

    const product = new Product({
      name,
      description,
      price: parsedPrice,
      category,
      brand: selectedBrand,
      stock: Number(resolvedStock),
      images,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      discountType: resolvedDiscountType,
      discountValue: resolvedDiscountType ? parsedDiscountValue : 0,
    });

    const savedProduct = await product.save();
    res.status(201).json({ success: true, data: savedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update product (Admin only)
export const updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      brand,
      brandId,
      stock,
      stockQty,
      countInStock,
      isFeatured,
      keepImages,
      discountType,
      discountValue,
    } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.name = name || product.name;
    product.description = description || product.description;
    if (price !== undefined) product.price = Number(price);
    product.category = category || product.category;
    const selectedBrand = brand || brandId;
    if (selectedBrand) product.brand = selectedBrand;
    
    const resolvedStock = stock !== undefined ? stock : (stockQty !== undefined ? stockQty : countInStock);
    if (resolvedStock !== undefined) product.stock = Number(resolvedStock);
    if (isFeatured !== undefined) {
      product.isFeatured = isFeatured === 'true' || isFeatured === true;
    }

    if (discountType !== undefined || discountValue !== undefined) {
      const targetPrice = product.price;
      const parsedDiscountValue = discountValue !== undefined ? Number(discountValue) : (product.discountValue || 0);
      const targetDiscountType = discountType !== undefined ? discountType : product.discountType;

      const resolvedDiscountType =
        targetDiscountType && ['percentage', 'fixed'].includes(targetDiscountType) && parsedDiscountValue > 0
          ? targetDiscountType
          : null;

      if (resolvedDiscountType === 'percentage' && parsedDiscountValue > 100) {
        return res.status(400).json({ success: false, message: 'Percentage discount cannot exceed 100%.' });
      }
      if (resolvedDiscountType === 'fixed' && parsedDiscountValue > targetPrice) {
        return res.status(400).json({ success: false, message: 'Fixed discount amount cannot exceed product price.' });
      }

      product.discountType = resolvedDiscountType;
      product.discountValue = resolvedDiscountType ? parsedDiscountValue : 0;
    }

    // Keep existing images or append new ones
    let finalImages = [];
    if (keepImages) {
      const parsedKeep = typeof keepImages === 'string' ? JSON.parse(keepImages) : keepImages;
      finalImages = Array.isArray(parsedKeep) ? parsedKeep : [parsedKeep];
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadedUrl = await uploadToCloudinary(file.path || file.filename, 'vault/products');
        if (uploadedUrl) {
          finalImages.push(uploadedUrl);
        }
      }
    }

    // Delete removed images from storage
    const removedImages = product.images.filter((img) => !finalImages.includes(img));
    deleteImageFiles(removedImages);

    // Update product images
    product.images = finalImages;

    const updatedProduct = await product.save();
    res.json({ success: true, data: updatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete product (Admin only)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Delete files from storage (both Cloudinary and legacy)
    deleteImageFiles(product.images);

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
