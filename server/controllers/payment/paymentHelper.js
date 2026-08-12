import Product from '../../models/Product.js';

// Helper — deduct stock idempotently (called from verify + webhook)
export const deductStockForOrder = async (order) => {
  if (order.stockDeducted) return; // already deducted — do nothing

  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (!product) continue;
    const newStock = product.stock - item.quantity;
    if (newStock < 0) {
      console.warn(`[VAULT] Stock underflow for product ${item.product} — setting to 0`);
      product.stock = 0;
    } else {
      product.stock = newStock;
    }
    await product.save();
  }

  order.stockDeducted = true;
  await order.save();
};
