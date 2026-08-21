import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ArrowRight,
  MapPin,
  Edit2,
  Plus,
  Minus,
  Trash2,
  ShieldCheck,
  Lock,
  Wallet,
  ShoppingBag,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { setDocumentSEO } from '../utils/seoHelper';
import { resolveImage } from '../utils/imageHelper';

// ── Load Razorpay checkout.js from CDN ──────────────────────────────────────
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Checkout() {
  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useContext(CartContext);
  const { user, loading, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    setDocumentSEO({
      title: 'Checkout | Vault.Co',
      description: 'Secure SSL checkout at Vault.Co.',
      noIndex: true,
      canonicalPath: '/checkout',
    });
  }, []);

  const [shippingInfo, setShippingInfo] = useState({
    shippingCharges: 100,
    freeShippingMinAmount: 1500,
    handlingCharge: 0,
    activeSpecialCampaign: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Item loading state mapping: { [productId]: 'increment' | 'decrement' | 'remove' | true }
  const [itemLoading, setItemLoading] = useState({});

  // Wallet state
  const [userWallet, setUserWallet] = useState(null);
  const [useWallet, setUseWallet] = useState(true);

  // Address mode: 'saved' shows the card, 'edit'/'new' shows the form
  const hasSavedAddress = !!(user && user.address && user.address.street);
  const [addressMode, setAddressMode] = useState(hasSavedAddress ? 'saved' : 'edit');
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(false);

  // Coupon states
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [applying, setApplying] = useState(false);
  const [freeShippingCoupon, setFreeShippingCoupon] = useState(false);

  useEffect(() => {
    if (user) {
      axios.get('/wallet').then((res) => {
        if (res.data.success) {
          setUserWallet(res.data.data);
        }
      }).catch(() => { });
    }
  }, [user]);

  useEffect(() => {
    axios
      .get('/shipping-settings')
      .then((res) => {
        if (res.data.success) {
          setShippingInfo(res.data.data);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Revalidate coupon when cartItems change (e.g. quantity changed or item removed)
  const revalidateAppliedCoupon = useCallback(async (currentItems, couponCodeToTest) => {
    if (!couponCodeToTest || !currentItems || currentItems.length === 0) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setFreeShippingCoupon(false);
      return;
    }
    try {
      const res = await axios.post('/coupon/apply', {
        couponCode: couponCodeToTest,
        items: currentItems.map((item) => ({
          product: item.product,
          price: item.price,
          quantity: item.quantity,
        })),
      });
      if (res.data.success) {
        const cp = res.data.data;
        setAppliedCoupon(cp);
        setCouponDiscount(cp.discountAmount);
        setFreeShippingCoupon(cp.freeShipping);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Coupon is no longer applicable to your cart.';
      toast.error(errMsg);
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setFreeShippingCoupon(false);
    }
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) {
      toast.warning('Please enter a coupon code.');
      return;
    }
    setApplying(true);
    try {
      const res = await axios.post('/coupon/apply', {
        couponCode: couponCodeInput.toUpperCase().trim(),
        items: cartItems.map((item) => ({
          product: item.product,
          price: item.price,
          quantity: item.quantity,
        })),
      });
      if (res.data.success) {
        const cp = res.data.data;
        setAppliedCoupon(cp);
        setCouponDiscount(cp.discountAmount);
        setFreeShippingCoupon(cp.freeShipping);
        toast.success(res.data.message || 'Coupon Applied!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid Coupon');
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setFreeShippingCoupon(false);
    } finally {
      setApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setFreeShippingCoupon(false);
    setCouponCodeInput('');
    toast.success('Coupon removed.');
  };

  // Quantity handlers with loading indicator & double-click protection
  const handleQuantityChange = async (productId, currentQty, delta, maxStock) => {
    const prodIdStr = String(productId);
    if (itemLoading[prodIdStr]) return;

    const targetQty = currentQty + delta;
    if (targetQty < 1) return;
    if (maxStock && targetQty > maxStock) {
      toast.warning(`Maximum available stock is ${maxStock}.`);
      return;
    }

    setItemLoading((prev) => ({ ...prev, [prodIdStr]: delta > 0 ? 'increment' : 'decrement' }));
    try {
      const result = await updateQuantity(prodIdStr, targetQty);
      if (result && result.success) {
        if (appliedCoupon?.couponCode) {
          const updatedItems = cartItems.map((item) =>
            String(item.product) === prodIdStr ? { ...item, quantity: targetQty } : item
          );
          await revalidateAppliedCoupon(updatedItems, appliedCoupon.couponCode);
        }
      }
    } finally {
      setItemLoading((prev) => {
        const next = { ...prev };
        delete next[prodIdStr];
        return next;
      });
    }
  };

  const handleRemoveItem = async (productId) => {
    const prodIdStr = String(productId);
    if (itemLoading[prodIdStr]) return;

    setItemLoading((prev) => ({ ...prev, [prodIdStr]: 'remove' }));
    try {
      removeFromCart(prodIdStr);
      toast.success('Item removed from cart.');

      const remainingItems = cartItems.filter((item) => String(item.product) !== prodIdStr);
      if (remainingItems.length === 0) {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setFreeShippingCoupon(false);
      } else if (appliedCoupon?.couponCode) {
        await revalidateAppliedCoupon(remainingItems, appliedCoupon.couponCode);
      }
    } finally {
      setItemLoading((prev) => {
        const next = { ...prev };
        delete next[prodIdStr];
        return next;
      });
    }
  };

  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  useEffect(() => {
    if (!loading && !user) navigate('/login?redirect=checkout');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('phone', user.phone || '');
      if (user.address) {
        setValue('street', user.address.street || '');
        setValue('city', user.address.city || '');
        setValue('state', user.address.state || '');
        setValue('zip', user.address.zip || '');
      }
    }
  }, [user, setValue]);

  let shippingCost = shippingInfo.shippingCharges;
  let isFreeShipping = false;
  let freeShippingNotice = null;

  if (cartTotal === 0 || freeShippingCoupon) {
    shippingCost = 0;
    isFreeShipping = true;
    if (freeShippingCoupon) freeShippingNotice = 'Coupon: Free Shipping';
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
  const grandTotal = Math.max(0, cartTotal - couponDiscount + shippingCost + handlingCost);

  const onSubmit = async (data) => {
    if (cartItems.length === 0) {
      toast.warning('Your cart is empty.');
      return;
    }

    setPaymentError('');

    const addressData =
      addressMode === 'saved' && hasSavedAddress
        ? {
          name: user.name,
          phone: user.phone || '',
          street: user.address.street,
          city: user.address.city,
          state: user.address.state,
          zip: user.address.zip,
        }
        : {
          name: data.name,
          phone: data.phone,
          street: data.street,
          city: data.city,
          state: data.state,
          zip: data.zip,
        };

    setSubmitting(true);

    try {
      if (
        saveAddressForFuture &&
        (addressMode === 'edit' || addressMode === 'new')
      ) {
        await updateProfile({
          name: addressData.name,
          phone: addressData.phone,
          address: {
            street: addressData.street,
            city: addressData.city,
            state: addressData.state,
            zip: addressData.zip,
          },
        });
      }

      const res = await axios.post('/payments/razorpay/create-order', {
        shippingAddress: addressData,
        items: cartItems.map((item) => ({
          product: item.product,
          quantity: item.quantity,
        })),
        couponCode: appliedCoupon ? appliedCoupon.couponCode : undefined,
        useWallet,
      });

      if (!res.data.success) {
        const msg = res.data.message || 'Could not initiate payment. Please try again.';
        toast.error(msg);
        setPaymentError(msg);
        setSubmitting(false);
        return;
      }

      if (res.data.fullWalletPayment) {
        toast.success(res.data.message || 'Order placed successfully using Vault Wallet!');
        clearCart();
        navigate('/order-success', {
          state: {
            orderId: res.data.data.internalOrderId,
            order: {
              _id: res.data.data.internalOrderId,
              grandTotal: res.data.data.grandTotal,
              paymentMethod: 'VAULT_WALLET',
              paymentStatus: 'captured',
            },
          },
        });
        return;
      }

      const { razorpayOrderId, amount, currency, keyId, internalOrderId } = res.data.data;

      const scriptLoaded = await loadRazorpay();
      if (!scriptLoaded) {
        const msg = 'Razorpay SDK failed to load. Please check your internet connection.';
        toast.error(msg);
        setPaymentError(msg);
        setSubmitting(false);
        return;
      }

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Vault.Co',
        description: `Order #${internalOrderId.slice(-6).toUpperCase()}`,
        order_id: razorpayOrderId,
        prefill: {
          name: addressData.name || user?.name || '',
          email: user?.email || '',
          contact: addressData.phone || user?.phone || '',
        },
        theme: {
          color: '#141414',
          backdrop_color: '#000000',
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            toast.info('Payment was cancelled. You can retry whenever you are ready.');
          },
          escape: true,
        },
        handler: async (response) => {
          try {
            const verifyRes = await axios.post('/payments/razorpay/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              internalOrderId,
            });

            if (verifyRes.data.success) {
              toast.success('Payment verified successfully!');
              clearCart();
              navigate('/order-success', {
                state: {
                  orderId: internalOrderId,
                  order: verifyRes.data.data,
                },
              });
            } else {
              const msg = verifyRes.data.message || 'Payment verification failed.';
              toast.error(msg);
              setPaymentError(msg);
              navigate('/order-success', {
                state: {
                  orderId: internalOrderId,
                  paymentFailed: true,
                  errorMessage: msg,
                },
              });
            }
          } catch (verifyErr) {
            console.error('Payment verification error:', verifyErr);
            const msg = verifyErr.response?.data?.message || 'Payment verification failed. Please contact support.';
            toast.error(msg);
            setPaymentError(msg);
            navigate('/order-success', {
              state: {
                orderId: internalOrderId,
                paymentFailed: true,
                errorMessage: msg,
              },
            });
          } finally {
            setSubmitting(false);
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', (response) => {
        console.error('Razorpay payment failed:', response.error);
        const reason = response.error.description || response.error.reason || 'Payment failed';
        setPaymentError(reason);
        toast.error(`Payment failed: ${reason}`);
        setSubmitting(false);
      });

      razorpayInstance.open();
    } catch (error) {
      console.error('Checkout submit error:', error);
      const msg = error.response?.data?.message || 'Error processing your order. Please try again.';
      toast.error(msg);
      setPaymentError(msg);
      setSubmitting(false);
    }
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="py-12 px-4 md:px-12 max-w-4xl mx-auto w-full min-h-[70vh] flex items-center justify-center">
        <div className="glass-card text-center py-16 px-6 max-w-md w-full flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800 mb-1">
            <ShoppingBag size={28} />
          </div>
          <h2 className="font-display font-extrabold text-lg uppercase tracking-tight text-text-primary">
            Your Cart is Empty
          </h2>
          <p className="text-xs text-text-secondary font-mono max-w-xs leading-relaxed">
            You don't have any items in your bag. Explore our luxury collection to add products to your checkout.
          </p>
          <Link
            to="/products"
            className="btn-gold text-xs uppercase tracking-widest py-3 px-8 mt-2 flex items-center gap-2"
          >
            <span>Continue Shopping</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen">
      <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-text-primary mb-6">
        Checkout
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          <div className="glass-card flex flex-col gap-4">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3">
              Shipping Address &amp; Contact
            </h3>

            {addressMode === 'saved' && hasSavedAddress && (
              <div className="flex flex-col gap-3">
                <div className="relative p-4 rounded-xl border-2 border-neutral-900 bg-neutral-50">
                  <span className="absolute top-3 right-3 text-[8px] font-mono font-bold uppercase tracking-widest bg-neutral-900 text-white px-2 py-0.5 rounded-full">
                    Selected
                  </span>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin size={13} className="text-white" />
                    </div>
                    <div className="flex flex-col gap-0.5 pr-20 min-w-0">
                      <p className="font-bold text-text-primary text-xs uppercase tracking-wide">{user.name}</p>
                      <p className="font-mono text-[10px] text-text-secondary">{user.phone || 'No phone saved'}</p>
                      <p className="font-mono text-[10px] text-text-secondary mt-0.5 leading-relaxed">
                        {user.address.street}
                        {user.address.city ? `, ${user.address.city}` : ''}
                        {user.address.state ? `, ${user.address.state}` : ''}
                        {user.address.zip ? ` – ${user.address.zip}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddressMode('edit')}
                    className="mt-3 self-end flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-text-primary border border-border-light bg-white hover:bg-neutral-100 hover:border-text-primary transition-all py-1.5 px-3 rounded-lg cursor-pointer ml-auto w-fit"
                  >
                    <Edit2 size={10} /> CHANGE
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setValue('name', '');
                    setValue('phone', '');
                    setValue('street', '');
                    setValue('city', '');
                    setValue('state', '');
                    setValue('zip', '');
                    setAddressMode('new');
                  }}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-dashed border-border-light text-text-secondary hover:border-text-primary hover:text-text-primary text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Plus size={12} /> ADD NEW ADDRESS
                </button>
              </div>
            )}

            {(addressMode === 'edit' || addressMode === 'new') && (
              <div className="flex flex-col gap-4">
                {hasSavedAddress && (
                  <button
                    type="button"
                    onClick={() => {
                      setValue('name', user.name);
                      setValue('phone', user.phone || '');
                      setValue('street', user.address.street || '');
                      setValue('city', user.address.city || '');
                      setValue('state', user.address.state || '');
                      setValue('zip', user.address.zip || '');
                      setAddressMode('saved');
                    }}
                    className="self-start flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    ← USE SAVED ADDRESS
                  </button>
                )}

                <div>
                  <label className="text-[9px] font-mono text-text-secondary uppercase tracking-wider block mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="Receiver name"
                    className={`form-input text-xs ${errors.name ? 'border-red-500/50' : ''}`}
                    {...register('name', { required: 'Name is required' })}
                  />
                  {errors.name && <span className="text-[9px] text-red-500 mt-1 block font-mono font-bold">{errors.name.message}</span>}
                </div>

                <div>
                  <label className="text-[9px] font-mono text-text-secondary uppercase tracking-wider block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder='Enter phone number'

                    maxLength={14}
                    className={`form-input text-xs ${errors.phone ? 'border-red-500/50' : ''}`}
                    {...register('phone', {
                      required: 'Phone number is required',
                      validate: (value) => {
                        const sanitized = (value || '').replace(/[\s\-()]/g, '');
                        return /^(?:(?:\+|0{0,2})91)?[6789]\d{9}$/.test(sanitized) || 'Enter a valid 10-digit mobile number';
                      },
                    })}
                  />
                  {errors.phone && <span className="text-[9px] text-red-500 mt-1 block font-mono font-bold">{errors.phone.message}</span>}
                </div>

                <div>
                  <label className="text-[9px] font-mono text-text-secondary uppercase tracking-wider block mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="House, Flat No, Apartment, Landmark"
                    className={`form-input text-xs ${errors.street ? 'border-red-500/50' : ''}`}
                    {...register('street', { required: 'Street address is required' })}
                  />
                  {errors.street && <span className="text-[9px] text-red-500 mt-1 block font-mono font-bold">{errors.street.message}</span>}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-mono text-text-secondary uppercase tracking-wider block mb-1">City</label>
                    <input
                      type="text"
                      placeholder="City"
                      className={`form-input text-xs ${errors.city ? 'border-red-500/50' : ''}`}
                      {...register('city', { required: 'Required' })}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-text-secondary uppercase tracking-wider block mb-1">State</label>
                    <input
                      type="text"
                      placeholder="State"
                      className={`form-input text-xs ${errors.state ? 'border-red-500/50' : ''}`}
                      {...register('state', { required: 'Required' })}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-text-secondary uppercase tracking-wider block mb-1">PIN Code</label>
                    <input
                      type="text"
                      placeholder="6-digit PIN"
                      maxLength={6}
                      className={`form-input text-xs ${errors.zip ? 'border-red-500/50' : ''}`}
                      {...register('zip', {
                        required: 'PIN required',
                        pattern: { value: /^[1-9][0-9]{5}$/, message: 'Invalid PIN' },
                      })}
                    />
                  </div>
                </div>

                <div className="mt-1">
                  <label className="flex items-center gap-2 cursor-pointer w-fit group">
                    <input
                      type="checkbox"
                      checked={saveAddressForFuture}
                      onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                      className="w-4 h-4 rounded border-border-light text-text-primary focus:ring-text-primary cursor-pointer transition-colors"
                    />
                    <span className="text-[10px] font-mono text-text-primary">Save this address for future orders</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="glass-card flex flex-col gap-3">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3">
              Payment
            </h3>

            {userWallet && userWallet.balance > 0 && (
              <div
                onClick={() => setUseWallet(!useWallet)}
                className={`p-4 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all ${useWallet ? 'bg-neutral-50 border-neutral-300' : 'bg-white border-border-light hover:border-neutral-300'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${useWallet ? 'border-text-primary' : 'border-neutral-300'}`}>
                    {useWallet && <div className="w-2.5 h-2.5 rounded-full bg-text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-sans font-bold text-xs uppercase tracking-wide text-text-primary flex items-center gap-2">
                        <Wallet size={14} className="text-text-primary" />
                        VAULT Wallet
                      </h4>
                      <span className="text-[10px] font-mono font-bold text-text-primary">
                        ₹{userWallet.balance.toLocaleString('en-IN')}
                      </span>
                    </div>
                    {useWallet && (
                      <div className="mt-3 pt-3 border-t border-border-light flex justify-between items-center text-[10px] font-mono">
                        <span className="text-text-secondary">Wallet Contribution</span>
                        <span className="font-bold text-[#16a34a]">-₹{Math.min(userWallet.balance, grandTotal).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div
              className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${(!useWallet || (userWallet && userWallet.balance < grandTotal)) ? 'bg-neutral-50 border-neutral-300' : 'bg-white border-border-light opacity-70'
                }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${(!useWallet || (userWallet && userWallet.balance < grandTotal)) ? 'border-text-primary' : 'border-neutral-300'}`}>
                  {(!useWallet || (userWallet && userWallet.balance < grandTotal)) && <div className="w-2.5 h-2.5 rounded-full bg-text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wide text-text-primary flex items-center gap-2">
                    <Lock size={14} className="text-text-primary" />
                    Razorpay
                  </h4>
                  <p className="text-[10px] font-mono text-text-secondary mt-1">
                    UPI, Cards, Net Banking & more
                  </p>
                  {(!useWallet || (userWallet && userWallet.balance < grandTotal)) && (
                    <div className="mt-3 pt-3 border-t border-border-light flex items-center gap-1.5 text-[9px] font-mono text-text-secondary">
                      <ShieldCheck size={11} className="text-[#16a34a]" />
                      <span>Secure payment powered by Razorpay</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {paymentError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2">
                <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-red-600 font-mono leading-relaxed">{paymentError}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="glass-card flex flex-col gap-4 sticky top-28">
            <div className="flex items-center justify-between border-b border-border-light pb-3">
              <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary">
                Order Review
              </h3>
              <span className="text-[10px] font-mono font-semibold text-text-secondary">
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)} item{cartItems.length === 1 && cartItems[0].quantity === 1 ? '' : 's'}
              </span>
            </div>

            <div className="max-h-[320px] overflow-y-auto pr-1 space-y-3 border-b border-border-light pb-4 divide-y divide-neutral-100">
              {cartItems.map((item) => {
                const prodIdStr = String(item.product);
                const isLoading = !!itemLoading[prodIdStr];
                const actionType = itemLoading[prodIdStr];
                const unitPrice = item.price;
                const isDiscounted = item.isDiscounted || (item.originalPrice && item.originalPrice > item.price);
                const originalPrice = item.originalPrice || item.price;
                const imageUrl = resolveImage(item.image);
                const maxStock = item.stock;

                return (
                  <div
                    key={prodIdStr}
                    className={`pt-3 first:pt-0 flex gap-3 items-start transition-opacity ${isLoading ? 'opacity-60' : 'opacity-100'
                      }`}
                  >
                    <div className="w-14 h-14 rounded-lg bg-neutral-50 border border-border-light overflow-hidden shrink-0 flex items-center justify-center p-1 relative">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <ShoppingBag size={18} className="text-neutral-300" />
                      )}
                      {isLoading && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <Loader2 size={14} className="animate-spin text-neutral-800" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-text-primary uppercase tracking-wide text-[11px] truncate leading-tight">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isDiscounted ? (
                              <>
                                <span className="text-text-primary font-bold font-mono text-xs">
                                  ₹{unitPrice.toLocaleString('en-IN')}
                                </span>
                                <span className="text-neutral-400 line-through font-mono text-[10px]">
                                  ₹{originalPrice.toLocaleString('en-IN')}
                                </span>
                              </>
                            ) : (
                              <span className="text-text-secondary font-mono text-[10px]">
                                ₹{unitPrice.toLocaleString('en-IN')} each
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-text-primary font-bold font-mono text-xs whitespace-nowrap">
                          ₹{(unitPrice * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-0.5">
                        <div className="flex items-center border border-neutral-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            disabled={item.quantity <= 1 || isLoading}
                            onClick={() => handleQuantityChange(prodIdStr, item.quantity, -1, maxStock)}
                            className="w-6 h-6 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Minus size={11} strokeWidth={2.5} />
                          </button>

                          <span className="w-7 text-center font-mono text-[11px] font-bold text-neutral-900 select-none">
                            {actionType === 'increment' || actionType === 'decrement' ? (
                              <span className="inline-block animate-pulse">{item.quantity}</span>
                            ) : (
                              item.quantity
                            )}
                          </span>

                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={(maxStock && item.quantity >= maxStock) || isLoading}
                            onClick={() => handleQuantityChange(prodIdStr, item.quantity, 1, maxStock)}
                            className="w-6 h-6 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Plus size={11} strokeWidth={2.5} />
                          </button>
                        </div>

                        <button
                          type="button"
                          aria-label="Remove product"
                          disabled={isLoading}
                          onClick={() => handleRemoveItem(prodIdStr)}
                          className="text-[10px] font-mono font-semibold text-neutral-400 hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {actionType === 'remove' ? (
                            <>
                              <Loader2 size={10} className="animate-spin" />
                              <span>Removing...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 size={11} />
                              <span>Remove</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-b border-border-light pb-4">
              <label className="text-[9px] font-mono text-text-secondary uppercase tracking-wider block mb-1.5">
                Have a Promo Coupon?
              </label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-neutral-100 border border-[#16a34a]/30 p-2.5 rounded-xl">
                  <div className="min-w-0">
                    <span className="font-mono text-xs font-bold text-[#16a34a] block">{appliedCoupon.couponCode}</span>
                    <span className="text-[9px] text-[#16a34a] font-mono block">
                      Saved ₹{couponDiscount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-[9px] font-mono font-bold uppercase py-1.5 px-3 bg-white border border-border-light text-red-500 rounded-lg hover:bg-neutral-50 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ENTER COUPON CODE"
                    className="form-input text-xs !py-2 !px-3 font-mono uppercase text-text-primary"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={applying}
                    className="btn-dark text-[9px] !py-2 !px-4 uppercase tracking-widest cursor-pointer disabled:opacity-50"
                  >
                    {applying ? '...' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2 border-b border-border-light pb-4 text-xs font-mono">
              <div className="flex justify-between text-text-secondary">
                <span>Items Subtotal</span>
                <span className="text-text-primary font-bold">₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-[#16a34a]">
                  <span>Coupon Discount</span>
                  <span className="font-bold">-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-text-secondary">
                <span>Shipping Cost</span>
                <span className="text-text-primary font-bold">
                  {shippingCost === 0 ? <span className="text-[#16a34a] font-extrabold">FREE</span> : `₹${shippingCost}`}
                </span>
              </div>
              {handlingCost > 0 && (
                <div className="flex justify-between text-text-secondary">
                  <span>Handling Charge</span>
                  <span className="text-text-primary font-bold">₹{handlingCost}</span>
                </div>
              )}
              {freeShippingNotice && (
                <div className="p-2 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg text-[10px] font-bold text-[#16a34a] font-mono">
                  {freeShippingNotice}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-xs font-bold pt-1 font-mono">
              <span className="uppercase text-text-primary">Grand Total</span>
              <span className="text-text-primary text-sm font-extrabold">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>

            <button
              type="submit"
              disabled={submitting || cartItems.length === 0}
              className="btn-gold text-[10px] mt-2 py-3.5 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <Lock size={12} /> PAY SECURELY ₹{grandTotal.toLocaleString('en-IN')}
                  <ArrowRight size={13} />
                </>
              )}
            </button>

            <div className="text-center space-y-1.5 mt-2">
              <p className="text-[8px] text-text-secondary font-mono">
                You will be redirected to Razorpay's secure checkout
              </p>
              <p className="text-[9px] text-neutral-500 font-sans leading-normal">
                By placing your order, you agree to our{' '}
                <Link to="/terms" target="_blank" className="text-neutral-900 underline font-medium hover:text-amber-600">
                  Terms of Service
                </Link>{' '}
                and acknowledge our{' '}
                <Link to="/privacy" target="_blank" className="text-neutral-900 underline font-medium hover:text-amber-600">
                  Privacy Policy
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
