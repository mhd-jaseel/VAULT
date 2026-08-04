import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import { paginateAggregate } from '../utils/paginate.js';

// @desc    Get active brands
// @route   GET /brands
// @access  Public
export const getBrands = async (req, res) => {
  try {
    const { page, limit = 10 } = req.query;
    if (page) {
      const result = await paginateAggregate(Brand, { isActive: true }, { name: 1 }, page, limit);
      return res.json({
        success: true,
        data: result.data,
        page: result.page,
        pages: result.pages,
        total: result.total,
      });
    }

    const brands = await Brand.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: brands });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all brands (admin)
// @route   GET /admin/brands
// @access  Private/Admin
export const getAdminBrands = async (req, res) => {
  try {
    const { page, limit = 10 } = req.query;
    if (page) {
      const result = await paginateAggregate(Brand, {}, { name: 1 }, page, limit);
      return res.json({
        success: true,
        data: result.data,
        page: result.page,
        pages: result.pages,
        total: result.total,
      });
    }

    const brands = await Brand.find().sort({ name: 1 });
    res.json({ success: true, data: brands });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a brand
// @route   POST /admin/brands
// @access  Private/Admin
export const createBrand = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Brand name is required' });
    }

    const brandExists = await Brand.findOne({ name });
    if (brandExists) {
      return res.status(400).json({ success: false, message: 'Brand already exists' });
    }

    const brand = await Brand.create({
      name,
      isActive: isActive === undefined ? true : (isActive === 'true' || isActive === true),
    });

    res.status(201).json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a brand
// @route   PATCH /admin/brands/:id
// @access  Private/Admin
export const updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    const { name, isActive } = req.body;
    if (name !== undefined) {
      brand.name = name;
    }
    if (isActive !== undefined) {
      brand.isActive = isActive === 'true' || isActive === true;
    }

    const updatedBrand = await brand.save();
    res.json({ success: true, data: updatedBrand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a brand
// @route   DELETE /admin/brands/:id
// @access  Private/Admin
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    // Check if products are linked
    const linkedProducts = await Product.countDocuments({ brand: brand._id });
    if (linkedProducts > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete brand. There are ${linkedProducts} products associated with this brand. Reassign them first.`,
      });
    }

    await brand.deleteOne();
    res.json({ success: true, message: 'Brand removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
