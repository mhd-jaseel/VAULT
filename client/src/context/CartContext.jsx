import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Load cart from local storage
  useEffect(() => {
    const storedCart = localStorage.getItem('vault_cart');
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
  }, []);

  // Save cart to local storage when it changes
  const saveCart = (items) => {
    setCartItems(items);
    localStorage.setItem('vault_cart', JSON.stringify(items));
  };

  const addToCart = (product, quantity = 1) => {
    const existingItemIndex = cartItems.findIndex((item) => item.product === product._id);
    const itemQuantity = Number(quantity);

    if (existingItemIndex > -1) {
      const updatedCart = [...cartItems];
      const newQty = updatedCart[existingItemIndex].quantity + itemQuantity;
      
      // Stock protection checks can be reinforced during actual dispatch
      updatedCart[existingItemIndex].quantity = newQty;
      saveCart(updatedCart);
    } else {
      const newItem = {
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.images && product.images.length > 0 ? product.images[0] : '',
        quantity: itemQuantity,
        stock: product.stock,
      };
      saveCart([...cartItems, newItem]);
    }
  };

  const updateQuantity = (productId, quantity) => {
    const updatedCart = cartItems.map((item) => {
      if (item.product === productId) {
        return { ...item, quantity: Math.max(1, Number(quantity)) };
      }
      return item;
    });
    saveCart(updatedCart);
  };

  const removeFromCart = (productId) => {
    const updatedCart = cartItems.filter((item) => item.product !== productId);
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
