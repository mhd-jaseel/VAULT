import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export const CartContext = createContext();

const DEFAULT_MAX_CART_QTY = 5;

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Load cart from local storage
  useEffect(() => {
    const storedCart = localStorage.getItem('vault_cart');
    if (storedCart) {
      try {
        const parsed = JSON.parse(storedCart);
        if (Array.isArray(parsed)) {
          // Normalize to ensure no duplicate products exist in localStorage
          const deduplicated = [];
          const seen = new Set();
          for (const item of parsed) {
            const pid = String(item.product);
            if (!seen.has(pid)) {
              seen.add(pid);
              deduplicated.push(item);
            } else {
              const existing = deduplicated.find((i) => String(i.product) === pid);
              if (existing) {
                existing.quantity = Math.min(
                  existing.stock || DEFAULT_MAX_CART_QTY,
                  existing.quantity + item.quantity
                );
              }
            }
          }
          setCartItems(deduplicated);
        }
      } catch (err) {
        console.error('Failed to parse cart storage', err);
      }
    }
  }, []);

  // Save cart to local storage when it changes
  const saveCart = (items) => {
    setCartItems(items);
    localStorage.setItem('vault_cart', JSON.stringify(items));
  };

  /**
   * Add to Cart with:
   * 1. Backend live stock and MAX_CART_QUANTITY_PER_PRODUCT validation.
   * 2. Duplicate prevention (reusing existing item entry).
   * 3. Live price resolution (honoring active product/campaign discounts).
   * 4. User-friendly limit notifications.
   */
  const addToCart = async (product, quantity = 1) => {
    const productId = String(product._id || product.product);
    const addQuantity = Math.max(1, Number(quantity) || 1);

    const existingItemIndex = cartItems.findIndex((item) => String(item.product) === productId);
    const currentQty = existingItemIndex > -1 ? cartItems[existingItemIndex].quantity : 0;
    const targetQty = currentQty + addQuantity;

    try {
      // Validate with backend source of truth
      const res = await axios.post(`/products/validate-cart/${productId}`, {
        quantity: targetQty,
      });

      if (res.data.success) {
        const validatedProduct = res.data.data.product;
        const unitPrice = validatedProduct.isDiscounted ? validatedProduct.finalPrice : validatedProduct.price;

        if (existingItemIndex > -1) {
          const updatedCart = [...cartItems];
          updatedCart[existingItemIndex] = {
            ...updatedCart[existingItemIndex],
            name: validatedProduct.name,
            price: unitPrice,
            quantity: targetQty,
            stock: validatedProduct.stock,
            image: validatedProduct.images?.[0] || updatedCart[existingItemIndex].image || '',
          };
          saveCart(updatedCart);
        } else {
          const newItem = {
            product: validatedProduct._id,
            name: validatedProduct.name,
            price: unitPrice,
            image: validatedProduct.images?.[0] || '',
            quantity: targetQty,
            stock: validatedProduct.stock,
          };
          saveCart([...cartItems, newItem]);
        }
        return { success: true, name: validatedProduct.name };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Cannot add more of this item to your cart.';
      const maxAllowed = err.response?.data?.maxAllowed;

      if (maxAllowed !== undefined && maxAllowed > 0 && maxAllowed !== currentQty) {
        // Adjust existing cart item to maximum allowed if partially permitted
        if (existingItemIndex > -1) {
          const updatedCart = [...cartItems];
          updatedCart[existingItemIndex].quantity = maxAllowed;
          saveCart(updatedCart);
        }
      }

      toast.error(errMsg);
      return { success: false, message: errMsg };
    }
  };

  /**
   * Update Quantity with backend limit validation:
   * Protects against manual input / rapid click manipulation.
   */
  const updateQuantity = async (productId, newQuantity) => {
    const prodIdStr = String(productId);
    const targetQty = Number(newQuantity);

    if (targetQty <= 0) {
      removeFromCart(prodIdStr);
      return { success: true, removed: true };
    }

    try {
      const res = await axios.post(`/products/validate-cart/${prodIdStr}`, {
        quantity: targetQty,
      });

      if (res.data.success) {
        const validatedProduct = res.data.data.product;
        const unitPrice = validatedProduct.isDiscounted ? validatedProduct.finalPrice : validatedProduct.price;

        const updatedCart = cartItems.map((item) => {
          if (String(item.product) === prodIdStr) {
            return {
              ...item,
              name: validatedProduct.name || item.name,
              price: unitPrice,
              originalPrice: validatedProduct.originalPrice || validatedProduct.price,
              finalPrice: validatedProduct.finalPrice || unitPrice,
              isDiscounted: !!validatedProduct.isDiscounted,
              discountAmount: validatedProduct.discountAmount || 0,
              quantity: targetQty,
              stock: validatedProduct.stock,
              image: validatedProduct.images?.[0] || item.image || '',
            };
          }
          return item;
        });
        saveCart(updatedCart);
        return { success: true, quantity: targetQty };
      }
      return { success: false };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Maximum quantity reached for this product.';
      toast.error(errMsg);
      return { success: false, message: errMsg };
    }
  };

  const removeFromCart = (productId) => {
    const prodIdStr = String(productId);
    const updatedCart = cartItems.filter((item) => String(item.product) !== prodIdStr);
    saveCart(updatedCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
