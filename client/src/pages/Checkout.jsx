import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { PremiumSwal } from '../utils/swalHelper';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [shippingCharges, setShippingCharges] = useState(100);
  const [freeShippingMin, setFreeShippingMin] = useState(1500);
  const [submitting, setSubmitting] = useState(false);

  // Coupon states
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [applying, setApplying] = useState(false);
  const [freeShippingCoupon, setFreeShippingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) {
      toast.warning('Please enter a coupon code.');
      return;
    }
    setApplying(true);
    try {
      const res = await axios.post('/coupon/apply', {
        couponCode: couponCodeInput.toUpperCase().trim(),
        items: cartItems.map(item => ({
          product: item.product,
          price: item.price,
          quantity: item.quantity
        }))
      });
      if (res.data.success) {
        const cp = res.data.data;
        setAppliedCoupon(cp);
        setCouponDiscount(cp.discountAmount);
        setFreeShippingCoupon(cp.freeShipping);
        toast.success(res.data.message || 'Coupon Applied Successfully!');
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
    if (!user) {
      navigate('/login?redirect=checkout');
    }
  }, [user]);

  useEffect(() => {
    // Prefill form if user has saved profile addresses
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

  useEffect(() => {
    axios.get('/settings')
      .then((res) => {
        if (res.data.success) {
          setShippingCharges(res.data.data.shippingCharges);
          setFreeShippingMin(res.data.data.freeShippingMinAmount);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  if (cartItems.length === 0) {
    return (
      <div className="py-20 text-center min-h-screen">
        <h2 className="text-text-primary font-bold font-mono text-xs uppercase">Your cart is empty.</h2>
        <button onClick={() => navigate('/shop')} className="btn-gold text-[10px] py-2 px-6 mt-4">
          GO SHOP
        </button>
      </div>
    );
  }

  const shippingCost = (cartTotal >= freeShippingMin || freeShippingCoupon) ? 0 : shippingCharges;
  const grandTotal = cartTotal - couponDiscount + shippingCost;

  const onSubmit = async (data) => {
    const result = await PremiumSwal.fire({
      title: 'Place Order?',
      text: `Confirm your shipping details and total cost of ₹${grandTotal.toLocaleString('en-IN')} before finalizing.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, place order',
      cancelButtonText: 'Review details'
    });

    if (!result.isConfirmed) return;

    setSubmitting(true);
    try {
      const orderPayload = {
        items: cartItems.map((item) => ({
          product: item.product,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddress: {
          name: data.name,
          phone: data.phone,
          street: data.street,
          city: data.city,
          state: data.state,
          zip: data.zip,
        },
        paymentMethod: data.paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.couponCode : undefined,
      };

      const res = await axios.post('/orders', orderPayload);
      if (res.data.success) {
        const orderId = res.data.data._id;
        
        // Clear client side cart state
        clearCart();

        if (data.paymentMethod === 'upi') {
          // Send to Manual payment verification page
          navigate(`/payment-upload/${orderId}`);
        } else {
          // COD goes straight to Order Success page
          navigate(`/order-success/${orderId}`);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error processing your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen">
      <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-text-primary mb-6">
        Checkout
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shipping Address Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card flex flex-col gap-4">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3">
              Shipping Address & Contact
            </h3>

            {/* Name */}
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

            {/* Phone */}
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

            {/* Street */}
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

            {/* Grid for City, State, Zip */}
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
                <label className="text-[9px] font-mono text-text-secondary uppercase tracking-wider block mb-1">Zip Code</label>
                <input
                  type="text"
                  placeholder="ZIP"
                  className={`form-input text-xs ${errors.zip ? 'border-red-500/50' : ''}`}
                  {...register('zip', { required: 'Required' })}
                />
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="glass-card flex flex-col gap-4">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3">
              Payment Method
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Manual UPI option */}
              <div className="relative">
                <input
                  type="radio"
                  id="pay_upi"
                  value="upi"
                  name="paymentMethod"
                  className="peer hidden"
                  defaultChecked
                  {...register('paymentMethod')}
                />
                <label
                  htmlFor="pay_upi"
                  className="flex flex-col p-4 rounded-xl border border-border-light bg-white hover:border-text-primary cursor-pointer transition-all peer-checked:border-brand-primary peer-checked:bg-neutral-50 text-text-secondary peer-checked:text-text-primary"
                >
                  <span className="font-bold font-sans text-xs tracking-wide uppercase">Manual UPI Payment</span>
                  <span className="text-[9px] font-mono text-text-secondary mt-1">
                    Pay using QR Code, submit Transaction ID and screenshot receipt.
                  </span>
                </label>
              </div>

              {/* Cash On Delivery option */}
              <div className="relative">
                <input
                  type="radio"
                  id="pay_cod"
                  value="cod"
                  name="paymentMethod"
                  className="peer hidden"
                  {...register('paymentMethod')}
                />
                <label
                  htmlFor="pay_cod"
                  className="flex flex-col p-4 rounded-xl border border-border-light bg-white hover:border-text-primary cursor-pointer transition-all peer-checked:border-brand-primary peer-checked:bg-neutral-50 text-text-secondary peer-checked:text-text-primary"
                >
                  <span className="font-bold font-sans text-xs tracking-wide uppercase">Cash On Delivery</span>
                  <span className="text-[9px] font-mono text-text-secondary mt-1">
                    Pay by cash upon receipt of shipping package at your doorstep.
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items Review Summary */}
        <div>
          <div className="glass-card flex flex-col gap-4 sticky top-28">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3">
              Order Review
            </h3>

            {/* Compact items list */}
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

            {/* Coupon Input Box */}
            <div className="border-b border-border-light pb-4">
              <label className="text-[9px] font-mono text-text-secondary uppercase tracking-wider block mb-1.5">Have a Promo Coupon?</label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-neutral-100 border border-[#16a34a]/30 p-2.5 rounded-xl">
                  <div className="min-w-0">
                    <span className="font-mono text-xs font-bold text-[#16a34a] block">{appliedCoupon.couponCode}</span>
                    <span className="text-[9px] text-[#16a34a] font-mono block">Saved ₹{couponDiscount.toLocaleString('en-IN')}</span>
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

            {/* Calculations */}
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
                <span className="text-text-primary font-bold">{shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs font-bold pt-1 font-mono">
              <span className="uppercase text-text-primary">Grand Total</span>
              <span className="text-text-primary text-sm font-extrabold">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-gold text-[10px] mt-2 py-3.5"
            >
              {submitting ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>PLACE ORDER <ArrowRight size={14} /></>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
