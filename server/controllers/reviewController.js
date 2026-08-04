import Review from '../models/Review.js';
import Product from '../models/Product.js';

export const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createReview = async (req, res) => {
  const { rating, comment } = req.body;
  const { productId } = req.params;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if review already exists
    const reviewExists = await Review.findOne({ product: productId, user: req.user._id });
    if (reviewExists) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      rating: Number(rating),
      comment,
    });

    // Recalculate average rating
    const reviews = await Review.find({ product: productId });
    const count = reviews.length;
    const average = reviews.reduce((sum, rev) => sum + rev.rating, 0) / count;

    product.ratings.count = count;
    product.ratings.average = parseFloat(average.toFixed(1));
    await product.save();

    const populatedReview = await Review.findById(review._id).populate('user', 'name');

    res.status(201).json({ success: true, data: populatedReview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
