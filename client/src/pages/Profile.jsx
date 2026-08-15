import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AuthContext } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import axios from 'axios';
import { User, ClipboardList, MapPin, CheckCircle, ChevronRight, LogOut, RotateCcw, Wallet, ArrowDownRight, ArrowUpRight, ShieldCheck, RefreshCw, AlertCircle, Star, Edit2, Trash2, ExternalLink } from 'lucide-react';
import WriteReviewModal from '../components/reviews/WriteReviewModal';
import { PremiumSwal } from '../utils/swalHelper';
import { resolveImage } from '../utils/imageHelper';
import { setDocumentSEO } from '../utils/seoHelper';

export default function Profile() {
  const { user, loading, updateProfile, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    setDocumentSEO({
      title: 'My Profile & Orders | Vault.Co',
      description: 'Manage your Vault.Co account, orders, and addresses.',
      noIndex: true,
      canonicalPath: '/profile',
    });
  }, []);

  // Active section state: 'orders', 'returns', 'wallet', 'reviews', 'profile'
  const [activeSection, setActiveSection] = useState('orders');

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const [pages, setPages] = useState(1);

  // My Reviews State
  const [myReviews, setMyReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPages, setReviewsPages] = useState(1);
  const [editingReview, setEditingReview] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Returns State (combines Returns + Cancellations)
  const [returnsList, setReturnsList] = useState([]);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [returnsError, setReturnsError] = useState(null);
  const [returnsPage, setReturnsPage] = useState(1);
  const [returnsPages, setReturnsPages] = useState(1);

  // Wallet State
  const [walletData, setWalletData] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [walletError, setWalletError] = useState(null);

  // Form handling for profile update
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login?redirect=profile');
    }
  }, [user, loading, navigate]);

  // Load user details into form
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

  // Fetch Orders Data with stable error handling (no loops)
  const fetchOrdersData = useCallback(async (pageNum = 1) => {
    if (!user) return;
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const res = await axios.get(`/orders/myorders?page=${pageNum}&limit=5`);
      if (res.data.success) {
        setOrders(res.data.data);
        setPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        setOrdersError('AUTH_REQUIRED');
      } else {
        setOrdersError('SERVER_ERROR');
      }
    } finally {
      setLoadingOrders(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && activeSection === 'orders') {
      fetchOrdersData(page);
    }
  }, [user, page, activeSection]);

  // Fetch Returns & Cancellations Data
  const fetchReturnsData = useCallback(async (pageNum = 1) => {
    if (!user) return;
    setLoadingReturns(true);
    setReturnsError(null);
    try {
      const res = await axios.get(`/returns/my-returns?page=${pageNum}&limit=10`);
      if (res.data.success) {
        setReturnsList(res.data.data);
        setReturnsPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error('Fetch returns error:', err);
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        setReturnsError('AUTH_REQUIRED');
      } else {
        setReturnsError('SERVER_ERROR');
      }
    } finally {
      setLoadingReturns(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && activeSection === 'returns') {
      fetchReturnsData(returnsPage);
    }
  }, [user, returnsPage, activeSection]);

  // Fetch Wallet Data
  const fetchWalletData = useCallback(async () => {
    if (!user) return;
    setLoadingWallet(true);
    setWalletError(null);
    try {
      const [wRes, tRes] = await Promise.all([
        axios.get('/wallet'),
        axios.get('/wallet/transactions?page=1&limit=10')
      ]);
      if (wRes.data.success) setWalletData(wRes.data.data);
      if (tRes.data.success) setWalletTransactions(tRes.data.data);
    } catch (err) {
      console.error('Fetch wallet error:', err);
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        setWalletError('AUTH_REQUIRED');
      } else {
        setWalletError('SERVER_ERROR');
      }
    } finally {
      setLoadingWallet(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && activeSection === 'wallet') {
      fetchWalletData();
    }
  }, [user, activeSection]);

  // Fetch My Reviews Data
  const fetchMyReviewsData = useCallback(async (pageNum = 1) => {
    if (!user) return;
    setLoadingReviews(true);
    setReviewsError(null);
    try {
      const res = await axios.get(`/reviews/my-reviews?page=${pageNum}&limit=10`);
      if (res.data.success) {
        setMyReviews(res.data.data);
        setReviewsPages(res.data.pagination?.pages || 1);
        setReviewsPage(pageNum);
      }
    } catch (err) {
      console.error('Fetch my reviews error:', err);
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        setReviewsError('AUTH_REQUIRED');
      } else {
        setReviewsError('SERVER_ERROR');
      }
    } finally {
      setLoadingReviews(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && activeSection === 'reviews') {
      fetchMyReviewsData(reviewsPage);
    }
  }, [user, activeSection, reviewsPage]);

  // Delete own review handler with confirmation
  const handleDeleteReview = async (reviewId) => {
    const result = await PremiumSwal.fire({
      title: 'Delete Review?',
      text: 'Are you sure you want to delete this product review?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        const res = await axios.delete(`/reviews/${reviewId}`);
        if (res.data.success) {
          toast.success('Review deleted successfully.');
          fetchMyReviewsData(reviewsPage);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete review.');
      }
    }
  };

  const onProfileUpdate = async (data) => {
    setUpdating(true);
    setUpdateSuccess('');
    setUpdateError('');

    const payload = {
      name: data.name,
      phone: data.phone,
      address: {
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.zip,
      }
    };

    const res = await updateProfile(payload);
    setUpdating(false);

    if (res.success) {
      toast.success('Profile details updated successfully!');
      setUpdateSuccess('Profile details updated successfully!');
      setValue('newPassword', '');
    } else {
      toast.error(res.message || 'Failed to update profile.');
      setUpdateError(res.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusBadge = (status) => {
    const map = {
      REQUESTED: { label: 'REQUESTED', cls: 'bg-neutral-100 text-neutral-800 border-neutral-300' },
      APPROVED: { label: 'APPROVED', cls: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
      REJECTED: { label: 'REJECTED', cls: 'bg-red-50 text-red-600 border-red-200' },
      WALLET_CREDITED: { label: 'WALLET CREDITED', cls: 'bg-emerald-100 text-emerald-800 border-emerald-400 font-bold' },
      REFUND_PROCESSING: { label: 'REFUND PROCESSING', cls: 'bg-amber-50 text-amber-800 border-amber-300' },
      REFUNDED: { label: 'REFUNDED', cls: 'bg-emerald-100 text-emerald-800 border-emerald-400 font-bold' },
      COMPLETED: { label: 'COMPLETED', cls: 'bg-emerald-100 text-emerald-800 border-emerald-400 font-bold' },
      CANCELLED: { label: 'CANCELLED', cls: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
    };
    const conf = map[status] || { label: status.replace(/_/g, ' '), cls: 'bg-neutral-100 text-neutral-800' };
    return (
      <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${conf.cls}`}>
        {conf.label}
      </span>
    );
  };

  if (loading) { return (<div className="flex items-center justify-center min-h-screen"><div className="text-center font-mono text-xl text-text-primary">Loading profile...</div></div>); }
if (!user) return null;

  // Derive distinct subsections for RETURNS tab (Return Requests vs Cancellations)
  const returnRequestsList = returnsList.filter(r => r.returnType !== 'CANCELLATION');
  const cancellationRecordsList = returnsList.filter(r => r.returnType === 'CANCELLATION');

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen pb-24 md:pb-12">
      {/* ── 1. Compact Premium Header ── */}
      <div className="glass-card mb-6 flex items-center justify-between border border-border-light bg-white p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 md:w-13 md:h-13 rounded-full bg-neutral-900 flex items-center justify-center text-white font-bold text-base md:text-lg uppercase font-sans flex-shrink-0">
            {user.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="min-w-0">
            <h2 className="text-xs md:text-sm font-extrabold text-text-primary uppercase tracking-wide truncate">{user.name}</h2>
            <p className="text-[10px] md:text-xs text-text-secondary truncate">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-1 py-1.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-[10px] font-sans font-bold tracking-widest uppercase transition-all active:scale-[0.98] cursor-pointer"
            aria-label="Logout account"
          >
            <LogOut size={11} /> LOGOUT
          </button>
        </div>
      </div>

      {/* ── Desktop Only: Compact Vault Wallet Balance Preview Card ── */}
      <div className="hidden md:flex mb-6 p-4 bg-white text-text-primary rounded-2xl border border-border-light items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center text-gold border border-border-light">
            <Wallet size={18} />
          </div>
          <div>
            <p className="text-[10px] text-text-secondary uppercase font-mono tracking-wider font-bold">VAULT WALLET</p>
            <p className="text-lg font-mono font-bold text-text-primary">
              ₹{(user.walletBalance || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveSection('wallet')}
          className="text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-50 hover:bg-neutral-100 text-text-primary px-3.5 py-2 rounded-xl border border-border-light transition-all flex items-center gap-1 cursor-pointer"
        >
          VIEW WALLET <ChevronRight size={12} />
        </button>
      </div>

      {/* ── 2. Single-Page Tab Navigation ── */}
      <div className="flex border-b border-border-light mb-6 gap-2 sm:gap-6 overflow-x-auto no-scrollbar scrollbar-none font-mono">
        <button
          onClick={() => setActiveSection('orders')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all shrink-0 px-2 sm:px-0 ${
            activeSection === 'orders' 
              ? 'border-neutral-900 text-text-primary font-extrabold' 
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <ClipboardList size={14} /> MY ORDERS
          </span>
        </button>

        <button
          onClick={() => setActiveSection('returns')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all shrink-0 px-2 sm:px-0 ${
            activeSection === 'returns' 
              ? 'border-neutral-900 text-text-primary font-extrabold' 
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <RotateCcw size={14} /> RETURNS
          </span>
        </button>

        <button
          onClick={() => setActiveSection('wallet')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all shrink-0 px-2 sm:px-0 ${
            activeSection === 'wallet' 
              ? 'border-neutral-900 text-text-primary font-extrabold' 
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Wallet className="text-[#d97706]" size={14} /> WALLET
          </span>
        </button>

        <button
          onClick={() => setActiveSection('reviews')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all shrink-0 px-2 sm:px-0 ${
            activeSection === 'reviews' 
              ? 'border-neutral-900 text-text-primary font-extrabold' 
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Star className="text-[#f5a623]" size={14} /> MY REVIEWS
          </span>
        </button>

        <button
          onClick={() => setActiveSection('profile')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all shrink-0 px-2 sm:px-0 ${
            activeSection === 'profile' 
              ? 'border-neutral-900 text-text-primary font-extrabold' 
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <User size={14} /> PROFILE
          </span>
        </button>
      </div>

      {/* ── 3. SECTION 1: MY ORDERS ── */}
      {activeSection === 'orders' && (
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl shimmer-bg" />
              ))}
            </div>
          ) : ordersError === 'AUTH_REQUIRED' ? (
            <div className="flex flex-col items-center justify-center text-center py-16 bg-white border border-border-light rounded-2xl px-4 font-mono">
              <AlertCircle className="text-amber-500 mb-2" size={32} />
              <p className="text-xs font-bold text-text-primary uppercase mb-1">Please log in to view your orders.</p>
              <button onClick={() => navigate('/login?redirect=profile')} className="btn-gold text-[10px] py-2 px-5 mt-3 uppercase font-bold tracking-wider cursor-pointer">
                LOGIN
              </button>
            </div>
          ) : ordersError ? (
            <div className="flex flex-col items-center justify-center text-center py-16 bg-white border border-border-light rounded-2xl px-4 font-mono">
              <AlertCircle className="text-red-500 mb-2" size={32} />
              <p className="text-xs font-bold text-text-primary uppercase mb-1">Unable to load orders.</p>
              <button onClick={() => fetchOrdersData(page)} className="btn-dark text-[10px] py-2 px-5 mt-3 uppercase font-bold tracking-wider cursor-pointer">
                RETRY
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 bg-white border border-border-light rounded-2xl px-4">
              <ClipboardList className="text-text-secondary mb-3 stroke-1" size={38} />
              <h3 className="font-bold text-xs font-mono text-text-primary uppercase tracking-wide">No orders placed yet.</h3>
              <p className="text-[11px] text-text-secondary font-mono mt-1 max-w-xs leading-relaxed">
                Browse our catalog to discover premium men's accessories.
              </p>
              <Link to="/shop" className="btn-gold text-[10px] py-2.5 px-6 mt-4 uppercase tracking-widest font-mono">
                Browse Shop
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <div 
                  key={ord._id}
                  className="glass-card border border-border-light hover:border-text-primary transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-5 rounded-2xl"
                >
                  <div className="space-y-1.5 font-mono">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-xs text-text-primary uppercase tracking-wider">
                        Order #{ord._id.toString().slice(-6).toUpperCase()}
                      </h4>
                      <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        ord.status === 'delivered' 
                          ? 'bg-[#e6f7ee] border-[#e6f7ee] text-[#16a34a]' 
                          : ord.status === 'cancelled' 
                          ? 'bg-red-50 border-red-100 text-red-600' 
                          : 'bg-neutral-100 border-border-light text-text-primary'
                      }`}>
                        {ord.status}
                      </span>
                      <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        ord.paymentStatus === 'SUCCESS' || ord.paymentStatus === 'captured' || ord.paymentStatus === 'verified'
                          ? 'bg-[#e6f7ee] border-[#e6f7ee] text-[#16a34a]' 
                          : ord.paymentStatus === 'FAILED' || ord.paymentStatus === 'failed' || ord.paymentStatus === 'rejected'
                          ? 'bg-red-50 border-red-100 text-red-600' 
                          : 'bg-neutral-100 border-border-light text-text-secondary'
                      }`}>
                        Payment: {ord.paymentStatus}
                      </span>
                    </div>
                    <p className="text-[9px] text-text-secondary">
                      Placed on {new Date(ord.createdAt).toLocaleDateString()} at {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-text-primary font-bold">
                      ₹{ord.grandTotal.toLocaleString('en-IN')} · {ord.items.reduce((sum, item) => sum + item.quantity, 0)} {ord.items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'item' : 'items'}
                    </p>
                  </div>

                  <div className="flex gap-2 min-h-[44px] items-center">
                    {(ord.paymentStatus === 'FAILED' || ord.paymentStatus === 'failed') && (
                      <Link
                        to="/checkout"
                        className="btn-gold !py-2.5 !px-4 text-[9px] uppercase tracking-wider text-center flex items-center justify-center font-mono font-bold"
                      >
                        Retry Payment
                      </Link>
                    )}
                    <Link
                      to={`/order-tracking/${ord._id}`}
                      className="btn-dark !py-2.5 !px-4 text-[9px] uppercase tracking-wider text-center flex items-center justify-center gap-1 font-mono font-bold flex-1 md:flex-initial"
                    >
                      Track Order <ChevronRight size={11} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Orders Pagination */}
          {pages > 1 && !ordersError && (
            <Pagination 
              page={page} 
              pages={pages} 
              onPageChange={(newPage) => setSearchParams({ page: newPage })} 
              loading={loadingOrders} 
            />
          )}
        </div>
      )}

      {/* ── 4. SECTION 2: COMBINED RETURNS & CANCELLATIONS ── */}
      {activeSection === 'returns' && (
        <div className="space-y-6">
          {loadingReturns ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 shimmer-bg rounded-2xl" />
              ))}
            </div>
          ) : returnsError === 'AUTH_REQUIRED' ? (
            <div className="flex flex-col items-center justify-center text-center py-16 bg-white border border-border-light rounded-2xl px-4 font-mono">
              <AlertCircle className="text-amber-500 mb-2" size={32} />
              <p className="text-xs font-bold text-text-primary uppercase mb-1">Please log in to view returns.</p>
              <button onClick={() => navigate('/login?redirect=profile')} className="btn-gold text-[10px] py-2 px-5 mt-3 uppercase font-bold tracking-wider cursor-pointer">
                LOGIN
              </button>
            </div>
          ) : returnsError ? (
            <div className="flex flex-col items-center justify-center text-center py-16 bg-white border border-border-light rounded-2xl px-4 font-mono">
              <AlertCircle className="text-red-500 mb-2" size={32} />
              <p className="text-xs font-bold text-text-primary uppercase mb-1">Unable to load returns.</p>
              <button onClick={() => fetchReturnsData(returnsPage)} className="btn-dark text-[10px] py-2 px-5 mt-3 uppercase font-bold tracking-wider cursor-pointer">
                RETRY
              </button>
            </div>
          ) : returnsList.length === 0 ? (
            <div className="bg-white border border-border-light rounded-2xl text-center py-16 px-4">
              <RotateCcw size={36} className="mx-auto mb-3 text-text-secondary opacity-40" />
              <h3 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wide">No return or cancellation requests yet.</h3>
              <p className="text-[11px] text-text-secondary font-mono mt-1 max-w-sm mx-auto">
                Submitted returns or item cancellations will appear here.
              </p>
              <button
                onClick={() => setActiveSection('orders')}
                className="btn-dark text-[10px] py-2.5 px-6 mt-4 inline-block uppercase tracking-wider font-mono cursor-pointer"
              >
                View My Orders
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* SUBSECTION A: RETURN REQUESTS */}
              {returnRequestsList.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest font-mono text-text-primary border-b border-border-light pb-2">
                    RETURN REQUESTS ({returnRequestsList.length})
                  </h4>
                  <div className="space-y-3">
                    {returnRequestsList.map((ret) => {
                      const settlement = ret.settlementMethod || 'WALLET';
                      return (
                        <div
                          key={ret._id}
                          className="bg-white border border-border-light hover:border-text-primary transition-all rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-5 shadow-xs"
                        >
                          <div className="space-y-1.5 font-mono">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-xs text-text-primary uppercase tracking-wider">
                                {ret.returnId}
                              </span>
                              <span className="text-[8px] uppercase px-2 py-0.5 rounded-full bg-neutral-100 text-text-secondary border border-border-light font-bold">
                                {settlement === 'WALLET' ? 'VAULT WALLET' : 'MANUAL REFUND'}
                              </span>
                              {getStatusBadge(ret.status)}
                            </div>

                            <p className="text-xs font-bold text-text-primary uppercase font-sans">
                              {ret.orderItem?.name}{' '}
                              <span className="text-text-secondary font-mono text-[10px]">× {ret.orderItem?.quantity}</span>
                            </p>

                            <p className="text-[10px] text-text-secondary">
                              Paid: <span className="font-bold text-text-primary">₹{ret.orderItem?.totalOriginalPaid?.toLocaleString('en-IN')}</span>
                              <span className="mx-1.5">·</span>
                              {new Date(ret.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 self-start md:self-center min-h-[44px]">
                            <Link
                              to={`/returns/${ret._id}`}
                              className="btn-dark !py-2.5 !px-4 text-[9px] uppercase tracking-wider text-center flex items-center justify-center gap-1 font-mono rounded-xl font-bold"
                            >
                              View Details <ChevronRight size={11} />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUBSECTION B: CANCELLATIONS */}
              {cancellationRecordsList.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest font-mono text-text-primary border-b border-border-light pb-2">
                    CANCELLATIONS ({cancellationRecordsList.length})
                  </h4>
                  <div className="space-y-3">
                    {cancellationRecordsList.map((can) => (
                      <div
                        key={can._id}
                        className="bg-white border border-border-light hover:border-text-primary transition-all rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-5 shadow-xs"
                      >
                        <div className="space-y-1.5 font-mono">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-xs text-text-primary uppercase tracking-wider">
                              {can.returnId}
                            </span>
                            <span className="text-[8px] uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-bold">
                              CANCELLED
                            </span>
                            {getStatusBadge(can.status)}
                          </div>

                          <p className="text-xs font-bold text-text-primary uppercase font-sans">
                            {can.orderItem?.name}{' '}
                            <span className="text-text-secondary font-mono text-[10px]">× {can.orderItem?.quantity}</span>
                          </p>

                          <p className="text-[10px] text-text-secondary">
                            Credited: <span className="font-bold text-text-primary">₹{can.orderItem?.totalOriginalPaid?.toLocaleString('en-IN')}</span>
                            <span className="mx-1.5">·</span>
                            {new Date(can.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-start md:self-center min-h-[44px]">
                          <Link
                            to={`/order-tracking/${can.order}`}
                            className="btn-dark !py-2.5 !px-4 text-[9px] uppercase tracking-wider text-center flex items-center justify-center gap-1 font-mono rounded-xl font-bold"
                          >
                            View Order <ChevronRight size={11} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {returnsPages > 1 && !returnsError && (
            <Pagination
              page={returnsPage}
              pages={returnsPages}
              onPageChange={(newPage) => {
                setReturnsPage(newPage);
                fetchReturnsData(newPage);
              }}
              loading={loadingReturns}
            />
          )}
        </div>
      )}

      {/* ── 5. SECTION 3: VAULT WALLET ── */}
      {activeSection === 'wallet' && (
        <div className="space-y-6">
          {loadingWallet ? (
            <div className="space-y-4">
              <div className="h-32 rounded-2xl shimmer-bg" />
              <div className="h-48 rounded-2xl shimmer-bg" />
            </div>
          ) : walletError === 'AUTH_REQUIRED' ? (
            <div className="flex flex-col items-center justify-center text-center py-16 bg-white border border-border-light rounded-2xl px-4 font-mono">
              <AlertCircle className="text-amber-500 mb-2" size={32} />
              <p className="text-xs font-bold text-text-primary uppercase mb-1">Please log in to view wallet.</p>
              <button onClick={() => navigate('/login?redirect=profile')} className="btn-gold text-[10px] py-2 px-5 mt-3 uppercase font-bold tracking-wider cursor-pointer">
                LOGIN
              </button>
            </div>
          ) : walletError ? (
            <div className="flex flex-col items-center justify-center text-center py-16 bg-white border border-border-light rounded-2xl px-4 font-mono">
              <AlertCircle className="text-red-500 mb-2" size={32} />
              <p className="text-xs font-bold text-text-primary uppercase mb-1">Unable to load wallet.</p>
              <button onClick={fetchWalletData} className="btn-dark text-[10px] py-2 px-5 mt-3 uppercase font-bold tracking-wider cursor-pointer">
                RETRY
              </button>
            </div>
          ) : (
            <>
              {/* Balance Card */}
              <div className="bg-white text-text-primary p-6 md:p-8 rounded-2xl border border-border-light shadow-sm font-mono relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gold"></div>
                
                <div className="space-y-1 mb-6 relative z-10">
                  <p className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                    <Wallet size={14} className="text-gold" />
                    AVAILABLE STORE CREDIT
                  </p>
                  <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight font-mono">
                    ₹{((walletData?.balance !== undefined ? walletData.balance : user.walletBalance) || 0).toLocaleString('en-IN')}
                  </h2>
                </div>
                <div className="pt-4 border-t border-border-light flex items-center justify-between text-[10px] md:text-[11px] text-text-secondary font-sans relative z-10">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600" /> Auto-applied at checkout for orders &amp; split payment.
                  </span>
                  <button
                    onClick={fetchWalletData}
                    className="p-1.5 rounded-md hover:bg-neutral-50 text-text-secondary hover:text-text-primary flex items-center gap-1 font-mono text-[9px] uppercase transition-colors cursor-pointer border border-transparent hover:border-border-light"
                  >
                    <RefreshCw size={11} /> Refresh
                  </button>
                </div>
                
                <div className="absolute -right-6 -bottom-6 opacity-[0.03] pointer-events-none z-0">
                  <Wallet size={120} />
                </div>
              </div>

              {/* Wallet Activity */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-text-primary font-mono border-b border-border-light pb-2">
                  RECENT ACTIVITY
                </h3>

                {walletTransactions.length === 0 ? (
                  <div className="p-6 text-center bg-neutral-50 rounded-2xl border border-border-light text-text-secondary font-mono text-xs">
                    No Vault Store Credit available yet. Credits from approved returns or cancellations will appear here automatically.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {walletTransactions.map((txn) => {
                      const isCredit = txn.type === 'CREDIT' || txn.amount > 0;
                      return (
                        <div
                          key={txn._id}
                          className="p-3.5 bg-white rounded-xl border border-border-light flex items-center justify-between gap-3 font-mono shadow-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isCredit ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                              }`}
                            >
                              {isCredit ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold uppercase text-text-primary truncate font-sans">
                                {txn.source ? txn.source.replace('_', ' ') : (isCredit ? 'Return Credit' : 'Order Payment')}
                              </h4>
                              <p className="text-[9px] text-text-secondary mt-0.5 truncate font-mono">
                                Ref #{txn.referenceId || txn.transactionId} · {new Date(txn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 font-mono">
                            <span className={`text-xs md:text-sm font-extrabold block ${isCredit ? 'text-emerald-700' : 'text-neutral-900'}`}>
                              {isCredit ? '+' : '-'} ₹{Math.abs(txn.amount).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[9px] text-text-secondary">
                              Bal: ₹{txn.balanceAfter.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 5. SECTION: MY REVIEWS ── */}
      {activeSection === 'reviews' && (
        <div className="space-y-6">
          <div className="pb-3 border-b border-border-light flex items-center justify-between">
            <div>
              <h2 className="text-base md:text-lg font-extrabold uppercase tracking-tight text-text-primary flex items-center gap-2">
                <Star className="text-[#f5a623] fill-[#f5a623]" size={18} /> MY REVIEWS
              </h2>
              <p className="text-xs text-text-secondary font-mono mt-0.5">
                Reviews you've shared about your purchases.
              </p>
            </div>
            {myReviews.length > 0 && (
              <span className="text-xs font-mono font-bold text-text-secondary">
                {myReviews.length} {myReviews.length === 1 ? 'REVIEW' : 'REVIEWS'}
              </span>
            )}
          </div>

          {loadingReviews ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-36 rounded-2xl shimmer-bg" />
              ))}
            </div>
          ) : reviewsError === 'AUTH_REQUIRED' ? (
            <div className="flex flex-col items-center justify-center text-center py-16 bg-white border border-border-light rounded-2xl px-4 font-mono">
              <AlertCircle className="text-amber-500 mb-2" size={32} />
              <p className="text-xs font-bold text-text-primary uppercase mb-1">Please log in to view your reviews.</p>
              <button
                onClick={() => navigate('/login?redirect=profile')}
                className="btn-gold text-[10px] py-2 px-5 mt-3 uppercase font-bold tracking-wider cursor-pointer"
              >
                LOGIN
              </button>
            </div>
          ) : reviewsError ? (
            <div className="flex flex-col items-center justify-center text-center py-16 bg-white border border-border-light rounded-2xl px-4 font-mono">
              <AlertCircle className="text-red-500 mb-2" size={32} />
              <p className="text-xs font-bold text-text-primary uppercase mb-1">Unable to load your reviews.</p>
              <button
                onClick={() => fetchMyReviewsData(reviewsPage)}
                className="btn-dark text-[10px] py-2 px-5 mt-3 uppercase font-bold tracking-wider cursor-pointer"
              >
                TRY AGAIN
              </button>
            </div>
          ) : myReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 bg-white border border-dashed border-border-light rounded-2xl px-4 space-y-3 font-mono">
              <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400">
                <Star size={24} className="text-[#f5a623]" />
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-text-primary font-sans">
                NO REVIEWS YET
              </h3>
              <p className="text-xs text-text-secondary max-w-sm">
                Reviews you write for your purchases will appear here.
              </p>
              <Link
                to="/shop"
                className="btn-gold text-[10px] !py-2.5 !px-6 uppercase tracking-widest font-bold mt-2 inline-block cursor-pointer"
              >
                SHOP NOW
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myReviews.map((rev) => {
                const prod = rev.product;
                const prodImg = prod?.images && prod.images.length > 0 ? prod.images[0] : null;

                return (
                  <div
                    key={rev._id}
                    className="p-5 bg-white border border-border-light rounded-2xl space-y-4 hover:border-text-primary/20 transition-all shadow-xs"
                  >
                    {/* Top row: Product image & details + actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-light pb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Product Image Thumbnail */}
                        <div className="w-14 h-14 rounded-xl bg-neutral-50 border border-border-light overflow-hidden flex items-center justify-center shrink-0 p-1">
                          {prodImg ? (
                            <img
                              src={resolveImage(prodImg)}
                              alt={prod?.name || 'Product'}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Star size={18} className="text-neutral-300" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <span className="text-[9px] font-mono uppercase text-text-secondary tracking-wider block">
                            {prod?.brand?.name || 'VAULT'}
                          </span>
                          <h4 className="font-sans font-bold text-xs text-text-primary uppercase tracking-tight truncate">
                            {prod?.name || 'Unknown Product'}
                          </h4>
                        </div>
                      </div>

                      {/* Actions: Edit / Delete Review */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingReview(rev);
                            setEditModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-light text-[10px] font-mono font-bold text-text-secondary hover:text-text-primary hover:border-text-primary transition-all cursor-pointer"
                        >
                          <Edit2 size={11} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReview(rev._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-[10px] font-mono font-bold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </div>

                    {/* Review content */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              className={
                                star <= rev.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-neutral-300'
                              }
                            />
                          ))}
                        </div>

                        {rev.title && (
                          <h5 className="font-sans font-bold text-xs text-text-primary">
                            {rev.title}
                          </h5>
                        )}

                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                            <CheckCircle size={10} /> Verified Purchase
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-700 font-sans leading-relaxed whitespace-pre-line">
                        {rev.comment}
                      </p>

                      {/* Review Photos if any */}
                      {rev.images && rev.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {rev.images.map((img, idx) => (
                            <a
                              key={idx}
                              href={resolveImage(img)}
                              target="_blank"
                              rel="noreferrer"
                              className="w-14 h-14 rounded-xl overflow-hidden border border-border-light hover:opacity-85 transition-opacity"
                            >
                              <img
                                src={resolveImage(img)}
                                alt="Review attachment"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Date details */}
                      <div className="pt-2 text-[10px] font-mono text-text-secondary flex items-center gap-3">
                        <span>Reviewed on {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        {rev.updatedAt && rev.updatedAt !== rev.createdAt && (
                          <span className="italic">
                            (Updated {new Date(rev.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {reviewsPages > 1 && (
                <div className="pt-4 flex justify-center">
                  <Pagination
                    currentPage={reviewsPage}
                    totalPages={reviewsPages}
                    onPageChange={(p) => fetchMyReviewsData(p)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 6. SECTION: EDIT PROFILE ── */}
      {activeSection === 'profile' && (
        <form onSubmit={handleSubmit(onProfileUpdate)} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Personal Info */}
          <div className="glass-card flex flex-col gap-4 p-5 rounded-2xl border border-border-light bg-white">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3">
              Personal Information
            </h3>

            {updateSuccess && <p className="text-[10px] text-[#16a34a] font-bold font-mono uppercase">{updateSuccess}</p>}
            {updateError && <p className="text-[10px] text-red-500 font-bold font-mono uppercase">{updateError}</p>}

            <div>
              <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Full Name</label>
              <input
                type="text"
                className="form-input text-xs"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && <span className="text-[9px] text-red-500 mt-1 block font-mono font-bold">{errors.name.message}</span>}
            </div>

            <div>
              <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Mobile Number</label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                maxLength={14}
                className={`form-input text-xs font-mono ${errors.phone ? 'border-red-500/50' : ''}`}
                {...register('phone', {
                  validate: (value) => {
                    if (!value || !value.trim()) return true; // Optional on profile
                    const sanitized = value.replace(/[\s\-()]/g, '');
                    return /^(?:(?:\+|0{0,2})91)?[6789]\d{9}$/.test(sanitized) || 'Enter a valid 10-digit mobile number starting with 6-9';
                  },
                })}
              />
              {errors.phone && <span className="text-[9px] text-red-500 mt-1 block font-mono font-bold">{errors.phone.message}</span>}
            </div>
          </div>

          {/* Address */}
          <div className="glass-card flex flex-col gap-4 p-5 rounded-2xl border border-border-light bg-white">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3">
              Default Shipping Address
            </h3>

            <div>
              <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Street Address</label>
              <input
                type="text"
                placeholder="Apartment, building, street coordinates"
                className="form-input text-xs"
                {...register('street')}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">City</label>
                <input
                  type="text"
                  placeholder="City"
                  className="form-input text-xs"
                  {...register('city')}
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">State</label>
                <input
                  type="text"
                  placeholder="State"
                  className="form-input text-xs"
                  {...register('state')}
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">PIN Code</label>
                <input
                  type="text"
                  placeholder="6-digit PIN"
                  maxLength={6}
                  className={`form-input text-xs font-mono ${errors.zip ? 'border-red-500/50' : ''}`}
                  {...register('zip', {
                    validate: (value) => {
                      if (!value || !value.trim()) return true;
                      return /^[1-9][0-9]{5}$/.test(value.trim()) || 'Enter a valid 6-digit PIN code';
                    },
                  })}
                />
                {errors.zip && <span className="text-[9px] text-red-500 mt-1 block font-mono font-bold">{errors.zip.message}</span>}
              </div>
            </div>

            <button
              type="submit"
              disabled={updating}
              className="btn-gold text-[10px] py-3.5 mt-2 min-h-[44px] flex items-center justify-center font-mono font-bold uppercase tracking-wider cursor-pointer"
            >
              {updating ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>SAVE CHANGES <CheckCircle size={14} className="ml-1" /></>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── Edit Review Modal ── */}
      {editingReview && (
        <WriteReviewModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingReview(null);
          }}
          productId={editingReview.product?._id || editingReview.product}
          productName={editingReview.product?.name || 'Product'}
          existingReview={editingReview}
          onReviewSubmitted={() => {
            toast.success('Review updated successfully.');
            fetchMyReviewsData(reviewsPage);
          }}
        />
      )}
    </div>
  );
}
