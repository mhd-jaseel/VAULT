import Discount from '../models/Discount.js';

/**
 * Calculates active discounts for a product or list of products.
 * Evaluates:
 * 1. Product-level discount (configured directly on Product)
 * 2. Product-specific discount campaign (from Discount model)
 * 3. Category-level discount campaign (from Discount model)
 * 4. Selected-products discount campaign (from Discount model)
 * 
 * Strict Rule: Discounts NEVER stack. The customer receives only the SINGLE HIGHEST BENEFIT discount.
 * 
 * @param {Object|Array} products - Mongoose product documents or plain product objects.
 * @returns {Promise<Object|Array>} Plain objects with resolved discount pricing fields.
 */
export const calculateProductDiscounts = async (products) => {
  if (!products) return products;

  const now = new Date();
  // Fetch active discount campaigns
  const activeDiscounts = await Discount.find({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
  });

  const isArray = Array.isArray(products);
  const productList = isArray ? products : [products];

  const decorated = productList.map((prod) => {
    const p = prod.toObject ? prod.toObject() : prod;
    const basePrice = Number(p.price) || 0;
    const prodIdStr = String(p._id);
    const catIdStr = p.category ? String(p.category._id || p.category) : '';

    // Collect all candidate discounts for this product
    const candidateDiscounts = [];

    // Candidate A: Product-level discount configured directly on Product
    if (
      p.discountType &&
      ['percentage', 'fixed'].includes(p.discountType) &&
      Number(p.discountValue) > 0
    ) {
      let amount = 0;
      if (p.discountType === 'percentage') {
        const pct = Math.min(100, Number(p.discountValue));
        amount = (basePrice * pct) / 100;
      } else {
        amount = Math.min(basePrice, Number(p.discountValue));
      }
      candidateDiscounts.push({
        source: 'product_level',
        discountType: p.discountType,
        discountValue: Number(p.discountValue),
        discountAmount: Math.max(0, amount),
        discountName: 'Product Discount',
        discountEndDate: null,
        showCountdown: false,
        priority: 0,
      });
    }

    // Candidate B: Discount campaigns from Discount collection (product, category, selectedProducts)
    activeDiscounts.forEach((d) => {
      let isMatch = false;
      if (d.applyType === 'product' && String(d.product) === prodIdStr) {
        isMatch = true;
      } else if (d.applyType === 'category' && catIdStr && String(d.category) === catIdStr) {
        isMatch = true;
      } else if (
        d.applyType === 'selectedProducts' &&
        Array.isArray(d.selectedProducts) &&
        d.selectedProducts.some((id) => String(id) === prodIdStr)
      ) {
        isMatch = true;
      }

      if (isMatch) {
        let amount = 0;
        if (d.discountType === 'percentage') {
          const pct = Math.min(100, Number(d.discountValue));
          amount = (basePrice * pct) / 100;
        } else {
          amount = Math.min(basePrice, Number(d.discountValue));
        }
        candidateDiscounts.push({
          source: 'campaign',
          discountType: d.discountType,
          discountValue: Number(d.discountValue),
          discountAmount: Math.max(0, amount),
          discountName: d.discountName,
          discountEndDate: d.endDate,
          showCountdown: !!d.showCountdown,
          priority: Number(d.priority) || 0,
        });
      }
    });

    // If no discount candidates exist, return base price
    if (candidateDiscounts.length === 0) {
      return {
        ...p,
        originalPrice: basePrice,
        discountAmount: 0,
        finalPrice: basePrice,
        discountType: null,
        discountValue: 0,
        discountEndDate: null,
        isDiscounted: false,
        discountName: null,
        showCountdown: false,
      };
    }

    // Sort candidates: Highest discount amount wins.
    // If amounts are tied, higher campaign priority wins.
    candidateDiscounts.sort((a, b) => {
      if (b.discountAmount !== a.discountAmount) {
        return b.discountAmount - a.discountAmount;
      }
      return b.priority - a.priority;
    });

    const bestDiscount = candidateDiscounts[0];
    let finalDiscountAmount = bestDiscount.discountAmount;

    if (finalDiscountAmount < 0) finalDiscountAmount = 0;
    if (finalDiscountAmount > basePrice) finalDiscountAmount = basePrice;

    const finalPrice = Math.round(basePrice - finalDiscountAmount);

    return {
      ...p,
      originalPrice: basePrice,
      discountAmount: finalDiscountAmount,
      finalPrice,
      discountType: bestDiscount.discountType,
      discountValue: bestDiscount.discountValue,
      discountEndDate: bestDiscount.discountEndDate,
      isDiscounted: finalDiscountAmount > 0,
      discountName: bestDiscount.discountName,
      showCountdown: bestDiscount.showCountdown,
      priority: bestDiscount.priority,
    };
  });

  return isArray ? decorated : decorated[0];
};
