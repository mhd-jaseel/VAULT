import Product from '../../models/Product.js';

// Helper — deduct stock idempotently and atomically (called from verify + webhook)
export const deductStockForOrder = async (order) => {
  if (order.stockDeducted) return; // already deducted — do nothing

  for (const item of order.items) {
    // Atomic deduction: only decrement if available stock >= requested quantity
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true }
    );

    // Fallback if stock was already at 0 or insufficient
    if (!updatedProduct) {
      console.warn(`[VAULT] Atomic decrement failed for product ${item.product} (stock was lower than ${item.quantity}). Setting to 0.`);
      await Product.findByIdAndUpdate(item.product, { stock: 0 });
    }
  }

  order.stockDeducted = true;
  await order.save();
};
