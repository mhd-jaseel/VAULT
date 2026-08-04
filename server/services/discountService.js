import Discount from '../models/Discount.js';

/**
 * Calculates active discounts for a product or list of products.
 * Prevents N+1 queries by fetching active discounts in a single pass.
 * 
 * @param {Object|Array} products - Mongoose product documents or plain product objects.
 * @returns {Promise<Object|Array>} Plain objects with resolved discount pricing fields.
 */
export const calculateProductDiscounts = async (products) => {
  if (!products) return products;

  const now = new Date();
  // Fetch active discounts
  const activeDiscounts = await Discount.find({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now }
  });

  const isArray = Array.isArray(products);
  const productList = isArray ? products : [products];

  const decorated = productList.map(prod => {
    const p = prod.toObject ? prod.toObject() : prod;
    const prodIdStr = String(p._id);
    const catIdStr = p.category ? String(p.category._id || p.category) : '';

    // Find matches
    const matches = activeDiscounts.filter(d => {
      if (d.applyType === 'product' && String(d.product) === prodIdStr) {
        return true;
      }
      if (d.applyType === 'category' && catIdStr && String(d.category) === catIdStr) {
        return true;
      }
      if (d.applyType === 'selectedProducts' && d.selectedProducts.some(id => String(id) === prodIdStr)) {
        return true;
      }
      return false;
    });

    if (matches.length === 0) {
      return {
        ...p,
        originalPrice: p.price,
        discountAmount: 0,
        finalPrice: p.price,
        discountType: null,
        discountValue: 0,
        discountEndDate: null,
        isDiscounted: false,
        discountName: null,
        showCountdown: false
      };
    }

    // Determine highest ranking match using priority and type score rules
    const sortedMatches = matches.map(d => {
      let typeScore = 1; // category
      if (d.applyType === 'product') typeScore = 3;
      else if (d.applyType === 'selectedProducts') typeScore = 2;

      // Higher priority and match-type rank wins
      const rank = (Number(d.priority) || 0) * 10 + typeScore;
      return { discount: d, rank };
    }).sort((a, b) => b.rank - a.rank);

    const bestDiscount = sortedMatches[0].discount;

    let discountAmount = 0;
    if (bestDiscount.discountType === 'percentage') {
      discountAmount = (p.price * bestDiscount.discountValue) / 100;
    } else {
      discountAmount = bestDiscount.discountValue;
    }

    // Keep discount amount within limits
    if (discountAmount < 0) discountAmount = 0;
    if (discountAmount > p.price) discountAmount = p.price;

    const finalPrice = Math.round(p.price - discountAmount);

    return {
      ...p,
      originalPrice: p.price,
      discountAmount,
      finalPrice,
      discountType: bestDiscount.discountType,
      discountValue: bestDiscount.discountValue,
      discountEndDate: bestDiscount.endDate,
      isDiscounted: discountAmount > 0,
      discountName: bestDiscount.discountName,
      showCountdown: !!bestDiscount.showCountdown
    };
  });

  return isArray ? decorated : decorated[0];
};
