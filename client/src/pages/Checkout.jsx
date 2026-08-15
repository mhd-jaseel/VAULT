import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowRight, MapPin, Edit2, Plus, ShieldCheck, Lock, Wallet } from 'lucide-react';
import { setDocumentSEO } from '../utils/seoHelper';

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
  const { cartItems, cartTotal, clearCart } = useContext(CartContext);
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
      }).catch(() => {});
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

  // Dynamic Shipping Calculation
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

  // ── Main form submit: build address, then launch Razorpay ──────────────────
  const onSubmit = async (data) => {
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
      // ── Step 0: Save address if requested ──────────────────────────────────
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

      // ── Step 1: Load Razorpay SDK ──────────────────────────────────────────
      const sdkLoaded = await loadRazorpay();
      if (!sdkLoaded) {
        toast.error('Unable to load payment gateway. Check your internet connection.');
        setSubmitting(false);
        return;
      }

      // ── Step 2: Create order on backend (validates stock, calculates total) ─
      const orderRes = await axios.post('/payments/razorpay/create-order', {
        items: cartItems.map((item) => ({
          product: item.product,
          name: item.name,
          quantity: item.quantity,
        })),
        shippingAddress: addressData,
        couponCode: appliedCoupon ? appliedCoupon.couponCode : undefined,
        useWallet,
      });

      if (!orderRes.data.success) {
        toast.error(orderRes.data.message || 'Could not initiate payment.');
        setSubmitting(false);
        return;
      }

      // Handle 100% Wallet Paid Orders
      if (orderRes.data.fullWalletPayment) {
        toast.success('Order placed successfully using Vault Wallet!');
        clearCart();
        navigate(`/order-success/${orderRes.data.data.internalOrderId}`);
        return;
      }

      const { razorpayOrderId, amount, currency, keyId, internalOrderId } = orderRes.data.data;

      // ── Step 3: Open Razorpay Standard Checkout ────────────────────────────
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'VAULT.CO',
        description: `Order #${internalOrderId}`,
        order_id: razorpayOrderId,
        prefill: {
          name: addressData.name,
          email: user.email || '',
          contact: addressData.phone,
        },
        theme: {
          color: '#111111',
        },
        modal: {
          ondismiss: () => {
            // User closed the modal — do NOT clear cart, do NOT confirm order
            setPaymentError('Payment was not completed. Your cart is safe. You can try again.');
            setSubmitting(false);
          },
        },
        handler: async (paymentResponse) => {
          // ── Step 4: Verify payment server-side ──────────────────────────────
          try {
            const verifyRes = await axios.post('/payments/razorpay/verify', {
              internalOrderId,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            if (verifyRes.data.success) {
              clearCart(); // Clear cart ONLY after verified payment
              navigate(`/order-success/${internalOrderId}`);
            } else {
              setPaymentError('Payment verification failed. Please contact support.');
              setSubmitting(false);
            }
          } catch (verifyErr) {
            setPaymentError(
              verifyErr.response?.data?.message || 'Payment verification failed. Please contact support.'
            );
            setSubmitting(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setPaymentError(`Payment failed: ${response.error?.description || 'Unknown error'}. Please try again.`);
        setSubmitting(false);
      });
      rzp.open();
    } catch (error) {
      const msg = error.response?.data?.message || 'Error processing your order. Please try again.';
      toast.error(msg);
      setPaymentError(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen">
      <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-text-primary mb-6">
        Checkout
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Shipping Address ── */}
          <div className="glass-card flex flex-col gap-4">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3">
              Shipping Address &amp; Contact
            </h3>

            {/* SAVED ADDRESS CARD VIEW */}
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

            {/* EDIT / NEW ADDRESS FORM */}
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
                    type="text"
                    placeholder="Active mobile number"
                    className={`form-input text-xs ${errors.phone ? 'border-red-500/50' : ''}`}
                    {...register('phone', { required: 'Phone number is required' })}
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
                    {errors.city && <span className="text-[9px] text-red-500 mt-1 block font-mono font-bold">{errors.city.message}</span>}
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-text-secondary uppercase tracking-wider block mb-1">State</label>
                    <input
                      type="text"
                      placeholder="State"
                      className={`form-input text-xs ${errors.state ? 'border-red-500/50' : ''}`}
                      {...register('state', { required: 'Required' })}
                    />
                    {errors.state && <span className="text-[9px] text-red-500 mt-1 block font-mono font-bold">{errors.state.message}</span>}
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-text-secondary uppercase tracking-wider block mb-1">Zip Code</label>
                    <input
                      type="text"
                      placeholder="ZIP"
                      className={`form-input text-xs ${errors.zip ? 'border-red-500/50' : ''}`}
                      {...register('zip', { required: 'Required' })}
                    />
                    {errors.zip && <span className="text-[9px] text-red-500 mt-1 block font-mono font-bold">{errors.zip.message}</span>}
                  </div>
                </div>

                {/* Save Address Checkbox */}
                <div className="mt-1">
                  <label className="flex items-center gap-2 cursor-pointer w-fit group">
                    <input
                      type="checkbox"
                      checked={saveAddressForFuture}
                      onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                      className="w-4 h-4 rounded border-border-light text-text-primary focus:ring-text-primary cursor-pointer transition-colors"
                    />
                    <span className="text-[10px] font-mono text-text-primary group-hover:text-text-primary/80 transition-colors">
                      Save this address for future orders
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* ── Payment Section ── */}
          <div className="glass-card flex flex-col gap-3">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3">
              Payment
            </h3>

            {userWallet && userWallet.balance > 0 && (
              <div
                onClick={() => setUseWallet(!useWallet)}
                className={`p-4 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all ${
                  useWallet ? 'bg-neutral-50 border-neutral-300' : 'bg-white border-border-light hover:border-neutral-300'
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
                    <p className="text-[10px] font-mono text-text-secondary mt-1">
                      Use your wallet balance
                    </p>
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
              className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${
                (!useWallet || (userWallet && userWallet.balance < grandTotal)) ? 'bg-neutral-50 border-neutral-300' : 'bg-white border-border-light opacity-70'
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

            {/* Payment error display */}
            {paymentError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2">
                <span className="text-red-500 text-sm leading-none mt-0.5">⚠</span>
                <p className="text-[10px] text-red-600 font-mono leading-relaxed">{paymentError}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Order Summary Sidebar ── */}
        <div>
          <div className="glass-card flex flex-col gap-4 sticky top-28">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3">
              Order Review
            </h3>

            {/* Cart items */}
            <div className="max-h-[220px] overflow-y-auto pr-1 space-y-3 border-b border-border-light pb-4">
              {cartItems.map((item) => (
                <div key={item.product} className="flex gap-3 justify-between items-center text-xs">
                  <div className="truncate flex-1">
                    <p className="font-bold text-text-primary uppercase tracking-wide truncate text-[11px]">{item.name}</p>
                    <span className="text-text-secondary font-mono text-[9px]">
                      ₹{item.price.toLocaleString('en-IN')} x {item.quantity}
                    </span>
                  </div>
                  <span className="text-text-primary font-bold font-mono">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon */}
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
                    className="btn-dark text-[9px] !py-2 !px-4 uppercase tracking-widest cursor-pointer"
                  >
                    {applying ? '...' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            {/* Totals */}
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
              disabled={submitting}
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

            <p className="text-[8px] text-text-secondary font-mono text-center">
              You will be redirected to Razorpay's secure checkout
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
