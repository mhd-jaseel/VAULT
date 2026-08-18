import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { PremiumSwal } from '../utils/swalHelper';
import axios from 'axios';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { resolveImage } from '../utils/imageHelper';
import { setDocumentSEO } from '../utils/seoHelper';

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [shippingInfo, setShippingInfo] = useState({
    shippingCharges: 100,
    freeShippingMinAmount: 1500,
    handlingCharge: 0,
    activeSpecialCampaign: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    setDocumentSEO({
      title: 'Shopping Cart | Vault.Co',
      description: 'Review your selected luxury items in your Vault.Co shopping cart.',
      noIndex: true,
      canonicalPath: '/cart',
    });
  }, []);

  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin/dashboard');
      return;
    }

    // Fetch dynamic shipping settings & active campaigns
    axios.get('/shipping-settings')
      .then((res) => {
        if (res.data.success) {
          setShippingInfo(res.data.data);
        }
      })
      .catch((err) => console.error(err));
  }, [user, navigate]);

  // Determine dynamic shipping calculation with special campaign priority
  let shippingCost = shippingInfo.shippingCharges;
  let isFreeShipping = false;
  let freeShippingNotice = null;

  if (cartTotal === 0) {
    shippingCost = 0;
  } else if (
    shippingInfo.activeSpecialCampaign &&
    cartTotal >= (shippingInfo.activeSpecialCampaign.minOrderAmount || 0)
  ) {
    shippingCost = 0;
    isFreeShipping = true;
    freeShippingNotice = `🎉 ${shippingInfo.activeSpecialCampaign.name}: FREE DELIVERY applied!`;
  } else if (cartTotal >= shippingInfo.freeShippingMinAmount) {
    shippingCost = 0;
    isFreeShipping = true;
  }

  const handlingCost = cartTotal > 0 ? (shippingInfo.handlingCharge || 0) : 0;
  const grandTotal = cartTotal + shippingCost + handlingCost;

  const handleRemoveItem = async (productId, itemName) => {
    const result = await PremiumSwal.fire({
      title: 'Remove Item?',
      text: `Are you sure you want to remove ${itemName} from your shopping bag?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      removeFromCart(productId);
    }
  };

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen">
      <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-text-primary mb-1">
        Shopping Bag
      </h1>
      <p className="text-xs text-text-secondary mb-6">Review your curated premium items before checking out.</p>

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 bg-white border border-border-light rounded-2xl">
          <ShoppingBag className="text-text-secondary mb-3 stroke-1" size={40} />
          <h3 className="font-bold text-sm text-text-primary uppercase tracking-wide">Your Shopping Bag is Empty</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-xs leading-relaxed">
            Fill your bag with premium leather goods, accessories, and perfumes.
          </p>
          <Link to="/shop" className="btn-gold text-[10px] py-2.5 px-6 mt-4 uppercase tracking-widest">
            Browse Accessories
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div 
                key={item.product}
                className="flex items-center gap-4 bg-white border border-border-light p-4 rounded-2xl relative"
              >
                {/* Image */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-50 flex-shrink-0 flex items-center justify-center border border-border-light p-2">
                  {item.image ? (
                    <>
                      <img 
                        src={resolveImage(item.image)} 
                        alt={item.name} 
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }
                        }}
                      />
                      <span className="text-neutral-300 font-bold text-xs font-mono hidden items-center justify-center">VAULT</span>
                    </>
                  ) : (
                    <span className="text-neutral-300 font-bold text-xs font-mono">VAULT</span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 pr-6">
                  <h4 className="font-bold text-xs text-text-primary uppercase tracking-wide truncate">{item.name}</h4>
                  <p className="text-xs text-text-primary font-bold font-mono mt-1">₹{item.price.toLocaleString('en-IN')}</p>
                  
                  {/* Quantity adjustments */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[9px] font-mono tracking-wider text-text-secondary uppercase">QTY:</span>
                    <div className="flex items-center border border-border-light rounded-full bg-white px-2 py-0.5">
                      <button
                        onClick={() => updateQuantity(item.product, item.quantity - 1)}
                        className="px-2 py-0.5 hover:text-text-primary text-text-secondary transition-colors font-bold text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold text-text-primary">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product, item.quantity + 1)}
                        className="px-2 py-0.5 hover:text-text-primary text-text-secondary transition-colors font-bold text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => handleRemoveItem(item.product, item.name)}
                  className="absolute top-4 right-4 text-text-secondary hover:text-red-500 cursor-pointer transition-colors"
                  title="Remove item"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div>
            <div className="glass-card flex flex-col gap-4">
              <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3">
                Order Summary
              </h3>

              <div className="space-y-2.5 border-b border-border-light pb-4 text-xs">
                <div className="flex justify-between text-text-secondary">
                  <span>Bag Subtotal</span>
                  <span className="text-text-primary font-bold font-mono">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-text-secondary">
                  <span>Shipping Charges</span>
                  <span className="text-text-primary font-bold font-mono">
                    {shippingCost === 0 ? (
                      <span className="text-[#16a34a] font-extrabold">FREE</span>
                    ) : (
                      `₹${shippingCost}`
                    )}
                  </span>
                </div>

                {handlingCost > 0 && (
                  <div className="flex justify-between text-text-secondary">
                    <span>Handling Charge</span>
                    <span className="text-text-primary font-bold font-mono">₹{handlingCost}</span>
                  </div>
                )}

                {freeShippingNotice && (
                  <div className="p-2 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg text-[10px] font-bold text-[#16a34a] font-mono">
                    {freeShippingNotice}
                  </div>
                )}

                {!isFreeShipping && shippingCost > 0 && (
                  <p className="text-[9px] font-mono text-text-secondary leading-relaxed">
                    Add <span className="text-text-primary font-bold">₹{(shippingInfo.freeShippingMinAmount - cartTotal).toLocaleString('en-IN')}</span> more to qualify for Free Shipping.
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center text-xs font-bold pt-1 font-mono">
                <span className="uppercase text-text-primary">Grand Total</span>
                <span className="text-text-primary text-sm font-extrabold">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="btn-gold text-[10px] py-3.5 mt-2"
              >
                PROCEED TO CHECKOUT <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
