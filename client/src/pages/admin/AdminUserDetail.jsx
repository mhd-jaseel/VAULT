import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { PremiumSwal } from '../../utils/swalHelper';
import { AuthContext } from '../../context/AuthContext';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  DollarSign,
  ShieldOff,
  ShieldCheck,
  Package,
  XCircle,
  CheckCircle2,
  Clock,
  Wallet,
  Sliders,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  X,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentAdmin } = useContext(AuthContext);

  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Wallet state
  const [walletData, setWalletData] = useState({
    walletBalance: 0,
    status: 'Active',
    transactions: [],
    page: 1,
    pages: 1,
  });
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletPage, setWalletPage] = useState(1);

  // Wallet adjustment modal states (Super Admin)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [adjustType, setAdjustType] = useState('CREDIT'); // 'CREDIT' | 'DEBIT'
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // Orders tab
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPages, setOrdersPages] = useState(1);

  // Block action
  const [blocking, setBlocking] = useState(false);

  const isSuperAdmin = Boolean(
    currentAdmin &&
      currentAdmin.email &&
      currentAdmin.email.toLowerCase() ===
        (import.meta.env.VITE_ADMIN_EMAIL || 'vault.co.6235@gmail.com').toLowerCase()
  );

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/auth/customers/${id}`);
      if (res.data.success) {
        setUserData(res.data.data.user);
        setStats(res.data.data.stats);
      }
    } catch (err) {
      toast.error('Failed to load user details.');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async (page = 1) => {
    setWalletLoading(true);
    try {
      const res = await axios.get(`/wallet/admin/users/${id}?page=${page}&limit=8`);
      if (res.data.success) {
        setWalletData({
          walletBalance: res.data.data.walletBalance,
          status: res.data.data.status,
          transactions: res.data.data.transactions,
          page: res.data.data.pagination.page,
          pages: res.data.data.pagination.pages,
        });
        setWalletPage(page);
      }
    } catch (err) {
      console.error('[VAULT] fetchWallet error:', err);
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchOrders = async (page = 1) => {
    setOrdersLoading(true);
    try {
      const res = await axios.get(`/auth/customers/${id}/orders?page=${page}&limit=8`);
      if (res.data.success) {
        setOrders(res.data.data);
        setOrdersPages(res.data.pages || 1);
        setOrdersPage(page);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchWallet(1);
    fetchOrders(1);
  }, [id]);

  const handleOpenAdjustModal = () => {
    setAdjustType('CREDIT');
    setAdjustAmount('');
    setAdjustReason('');
    setIsAdjustModalOpen(true);
    setIsConfirmModalOpen(false);
  };

  const handleProceedToConfirm = (e) => {
    e.preventDefault();
    const num = Number(adjustAmount);
    if (!adjustAmount || isNaN(num) || num <= 0) {
      toast.error('Please enter a valid positive adjustment amount.');
      return;
    }
    if (num > 1000000) {
      toast.error('Adjustment amount cannot exceed ₹10,00,000.');
      return;
    }
    if (!adjustReason || !adjustReason.trim()) {
      toast.error('A reason for wallet adjustment is mandatory.');
      return;
    }
    if (adjustType === 'DEBIT' && (walletData.walletBalance || 0) < num) {
      toast.error('Insufficient wallet balance. Cannot deduct more than available balance.');
      return;
    }

    setIsConfirmModalOpen(true);
  };

  const handleExecuteAdjustment = async () => {
    if (adjustSubmitting) return;

    setAdjustSubmitting(true);
    try {
      const idempotencyKey = `ADJ-${id}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const res = await axios.post(`/wallet/admin/users/${id}/adjust`, {
        amount: Number(adjustAmount),
        direction: adjustType,
        reason: adjustReason.trim(),
        idempotencyKey,
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Wallet adjusted successfully.');
        setIsConfirmModalOpen(false);
        setIsAdjustModalOpen(false);
        await Promise.all([fetchWallet(1), fetchUser()]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing wallet adjustment.');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const handleBlock = async () => {
    const result = await PremiumSwal.fire({
      title: 'Block User?',
      text: 'A blocked user will not be able to log in or use the website. Their active session will be terminated immediately.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Block User',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    setBlocking(true);
    try {
      const res = await axios.patch(`/auth/customers/${id}/block`);
      if (res.data.success) {
        toast.success('User blocked successfully.');
        await Promise.all([fetchUser(), fetchWallet(walletPage)]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to block user.');
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblock = async () => {
    const result = await PremiumSwal.fire({
      title: 'Unblock User?',
      text: 'The user will be able to log in and use the website normally after being unblocked.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Unblock User',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    setBlocking(true);
    try {
      const res = await axios.patch(`/auth/customers/${id}/unblock`);
      if (res.data.success) {
        toast.success('User unblocked successfully.');
        await Promise.all([fetchUser(), fetchWallet(walletPage)]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unblock user.');
    } finally {
      setBlocking(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'text-[#16a34a] bg-[#e6f7ee] border-[#e6f7ee]';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-100';
      case 'shipped': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-text-primary bg-neutral-100 border-border-light';
    }
  };

  const getPaymentColor = (status) => {
    switch (status) {
      case 'verified': return 'text-[#16a34a] bg-[#e6f7ee] border-[#e6f7ee]';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-text-secondary bg-neutral-100 border-border-light';
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!userData) return null;

  const u = userData;
  const currentWalletBal = walletData.walletBalance ?? u.walletBalance ?? 0;
  const parsedAmt = Number(adjustAmount) || 0;
  const simulatedNewBal =
    adjustType === 'CREDIT' ? currentWalletBal + parsedAmt : currentWalletBal - parsedAmt;

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen font-sans text-[#111111] min-w-0">
      {/* Back */}
      <Link
        to="/admin/users"
        className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors font-mono text-[10px] mb-6 tracking-wider"
      >
        <ArrowLeft size={12} /> BACK TO USERS
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT: Profile Card & Saved Address ── */}
        <div className="space-y-6">
          {/* Profile */}
          <div className="glass-card flex flex-col gap-4">
            {/* Avatar + Name */}
            <div className="flex flex-col items-center text-center gap-3 pb-4 border-b border-border-light">
              <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center text-white font-bold text-2xl uppercase">
                {u.name?.charAt(0)}
              </div>
              <div>
                <h2 className="font-bold text-text-primary text-sm uppercase tracking-wide">{u.name}</h2>
                <p className="text-[9px] font-mono text-text-secondary">{u.role?.toUpperCase()}</p>
              </div>

              {/* Status badge */}
              {u.isBlocked ? (
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                  <ShieldOff size={10} /> BLOCKED
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#16a34a] bg-[#e6f7ee] border border-[#e6f7ee] px-3 py-1 rounded-full">
                  <ShieldCheck size={10} /> ACTIVE
                </span>
              )}
            </div>

            {/* Info rows */}
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <Mail size={12} className="text-text-secondary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[8px] font-mono text-text-secondary uppercase tracking-wider">Email</p>
                  <p className="text-[10px] font-mono text-text-primary break-all">{u.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone size={12} className="text-text-secondary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[8px] font-mono text-text-secondary uppercase tracking-wider">Phone</p>
                  <p className="text-[10px] font-mono text-text-primary">{u.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Calendar size={12} className="text-text-secondary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[8px] font-mono text-text-secondary uppercase tracking-wider">Registered</p>
                  <p className="text-[10px] font-mono text-text-primary">
                    {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Block / Unblock Button */}
            <div className="border-t border-border-light pt-4">
              {u.isBlocked ? (
                <button
                  onClick={handleUnblock}
                  disabled={blocking}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#e6f7ee] border border-[#16a34a]/30 text-[#16a34a] text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-green-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck size={12} />
                  {blocking ? 'Processing...' : 'Unblock User'}
                </button>
              ) : (
                <button
                  onClick={handleBlock}
                  disabled={blocking}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-red-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  <ShieldOff size={12} />
                  {blocking ? 'Processing...' : 'Block User'}
                </button>
              )}
            </div>
          </div>

          {/* Saved Address */}
          <div className="glass-card flex flex-col gap-3">
            <h3 className="font-mono font-bold text-[10px] uppercase tracking-wider text-text-secondary border-b border-border-light pb-2.5">
              Saved Address
            </h3>
            {u.address && u.address.street ? (
              <div className="flex items-start gap-2.5">
                <MapPin size={12} className="text-text-secondary mt-0.5 flex-shrink-0" />
                <p className="text-[10px] font-mono text-text-primary leading-relaxed">
                  {u.address.street}
                  {u.address.city ? `, ${u.address.city}` : ''}
                  {u.address.state ? `, ${u.address.state}` : ''}
                  {u.address.zip ? ` – ${u.address.zip}` : ''}
                  {u.address.country ? `, ${u.address.country}` : ''}
                </p>
              </div>
            ) : (
              <p className="text-[9px] text-text-secondary font-mono">No address saved.</p>
            )}
          </div>
        </div>

        {/* ── RIGHT: Stats + Wallet + Orders ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="glass-card !p-4 flex flex-col gap-1">
                <span className="text-[9px] font-mono text-text-secondary uppercase tracking-widest">Total Orders</span>
                <span className="text-xl font-bold text-text-primary font-mono">{stats.totalOrders}</span>
              </div>
              <div className="glass-card !p-4 flex flex-col gap-1">
                <span className="text-[9px] font-mono text-text-secondary uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={9} className="text-[#16a34a]" /> Completed</span>
                <span className="text-xl font-bold text-[#16a34a] font-mono">{stats.completedOrders}</span>
              </div>
              <div className="glass-card !p-4 flex flex-col gap-1">
                <span className="text-[9px] font-mono text-text-secondary uppercase tracking-widest flex items-center gap-1"><Clock size={9} className="text-amber-500" /> Pending</span>
                <span className="text-xl font-bold text-amber-600 font-mono">{stats.pendingOrders}</span>
              </div>
              <div className="glass-card !p-4 flex flex-col gap-1">
                <span className="text-[9px] font-mono text-text-secondary uppercase tracking-widest flex items-center gap-1"><XCircle size={9} className="text-red-500" /> Cancelled</span>
                <span className="text-xl font-bold text-red-600 font-mono">{stats.cancelledOrders}</span>
              </div>
              <div className="glass-card !p-4 flex flex-col gap-1 md:col-span-2">
                <span className="text-[9px] font-mono text-text-secondary uppercase tracking-widest flex items-center gap-1"><DollarSign size={9} /> Total Spent</span>
                <span className="text-xl font-bold text-text-primary font-mono">₹{stats.totalSpent.toLocaleString('en-IN')}</span>
                <span className="text-[8px] text-text-secondary font-mono">Verified payments only</span>
              </div>
            </div>
          )}

          {/* ── 1. WALLET MANAGEMENT SECTION ── */}
          <div className="glass-card flex flex-col gap-4 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-light pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="text-[#d97706]" size={16} />
                <h3 className="font-bold text-xs uppercase tracking-wider text-text-primary font-mono">
                  Vault Wallet
                </h3>
              </div>

              {/* Super Admin only Action Button */}
              {isSuperAdmin && (
                <button
                  onClick={handleOpenAdjustModal}
                  className="px-3 py-1.5 bg-[#111111] hover:bg-black text-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sliders size={12} /> Adjust Wallet
                </button>
              )}
            </div>

            {/* Wallet Overview Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#f9fafb] p-4 rounded-2xl border border-border-light font-mono">
              <div>
                <span className="text-[9px] text-text-secondary uppercase tracking-widest block font-bold">
                  Wallet Balance
                </span>
                <span className="text-2xl font-black text-[#111111] font-mono block mt-0.5">
                  ₹{currentWalletBal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-text-secondary uppercase tracking-widest block font-bold">
                  Wallet Status
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border mt-1.5 ${
                    walletData.status?.includes('Active')
                      ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]'
                      : 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {walletData.status || 'Active'}
                </span>
              </div>
            </div>

            {/* Wallet Transactions History Table */}
            <div className="space-y-2 pt-2">
              <h4 className="text-[10px] font-extrabold uppercase text-text-secondary tracking-wider">
                Wallet Transactions
              </h4>

              {walletLoading ? (
                <div className="py-8 text-center text-xs text-text-secondary font-mono flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-[#111111] border-t-transparent animate-spin" />
                  Loading transactions...
                </div>
              ) : walletData.transactions.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-border-light rounded-xl text-xs text-text-secondary font-mono">
                  No wallet transactions recorded for this customer yet.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border-light text-text-secondary font-mono text-[9px] uppercase tracking-wider bg-neutral-50">
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">Description</th>
                          <th className="p-2.5">Amount</th>
                          <th className="p-2.5">Balance After</th>
                          <th className="p-2.5">Performed By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light/60">
                        {walletData.transactions.map((txn) => {
                          const isCredit = txn.type === 'CREDIT';

                          return (
                            <tr key={txn._id} className="hover:bg-neutral-50/70 transition-colors">
                              <td className="p-2.5 font-mono text-[9px] text-text-secondary whitespace-nowrap">
                                {new Date(txn.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="p-2.5 whitespace-nowrap">
                                <span
                                  className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                    txn.source === 'ADMIN_ADJUSTMENT'
                                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                                      : isCredit
                                      ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]'
                                      : 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]'
                                  }`}
                                >
                                  {txn.source?.replace(/_/g, ' ') || txn.type}
                                </span>
                              </td>
                              <td className="p-2.5 text-[10px] text-text-primary max-w-xs truncate font-sans" title={txn.description}>
                                {txn.description}
                              </td>
                              <td className={`p-2.5 font-bold font-mono text-[11px] whitespace-nowrap ${isCredit ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                                {isCredit ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                              </td>
                              <td className="p-2.5 font-bold font-mono text-[10px] text-text-primary whitespace-nowrap">
                                ₹{txn.balanceAfter?.toLocaleString('en-IN') ?? '—'}
                              </td>
                              <td className="p-2.5 text-[9px] font-mono text-text-secondary whitespace-nowrap">
                                {txn.performedByAdminName || txn.performedByAdminEmail || txn.createdBy || 'SYSTEM'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {walletData.pages > 1 && (
                    <Pagination
                      page={walletPage}
                      pages={walletData.pages}
                      onPageChange={(p) => fetchWallet(p)}
                      loading={walletLoading}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── 2. ORDER HISTORY SECTION ── */}
          <div className="glass-card flex flex-col gap-4">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3 flex items-center gap-1.5">
              <ShoppingBag size={13} /> Order History
            </h3>

            {ordersLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-12 shimmer-bg rounded-xl" />)}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-10">
                <Package className="text-text-secondary mx-auto mb-2 stroke-1" size={32} />
                <p className="text-[10px] text-text-secondary font-mono">No orders found for this user.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border-light text-text-secondary font-mono text-[9px] uppercase tracking-wider">
                        <th className="pb-2 pr-4">Order ID</th>
                        <th className="pb-2 pr-4">Date</th>
                        <th className="pb-2 pr-4">Items</th>
                        <th className="pb-2 pr-4">Total</th>
                        <th className="pb-2 pr-4">Payment</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((ord) => (
                        <tr key={ord._id} className="border-b border-border-light/50 hover:bg-neutral-50 transition-colors">
                          <td className="py-3 pr-4 font-mono font-bold text-text-primary text-[10px]">
                            #{ord._id.toString().slice(-6).toUpperCase()}
                          </td>
                          <td className="py-3 pr-4 font-mono text-text-secondary text-[9px]">
                            {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3 pr-4 text-text-secondary text-[9px] font-mono">
                            {ord.items?.reduce((s, i) => s + i.quantity, 0) ?? 0} units
                          </td>
                          <td className="py-3 pr-4 font-bold font-mono text-text-primary text-[10px]">
                            ₹{ord.grandTotal?.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPaymentColor(ord.paymentStatus)}`}>
                              {ord.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(ord.status)}`}>
                              {ord.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  page={ordersPage}
                  pages={ordersPages}
                  onPageChange={(p) => fetchOrders(p)}
                  loading={ordersLoading}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── STEP 1: SUPER ADMIN ADJUST WALLET MODAL ── */}
      {isAdjustModalOpen && !isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto font-sans">
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-[#111111]">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="text-[#d97706]" size={18} />
                <h3 className="font-bold text-sm uppercase text-[#111111]">
                  Adjust User Wallet
                </h3>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-[#6b7280] hover:text-[#111111] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Current Balance Display */}
            <div className="bg-[#f9fafb] p-3.5 rounded-xl border border-[#e5e5e5] font-mono">
              <span className="text-[10px] text-[#6b7280] uppercase font-bold block mb-0.5">
                Current Balance
              </span>
              <span className="font-extrabold text-[#111111] text-lg">
                ₹{currentWalletBal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <form onSubmit={handleProceedToConfirm} className="space-y-4 font-mono text-xs">
              {/* Adjustment Type Radios */}
              <div>
                <label className="text-[10px] text-[#6b7280] uppercase font-bold block mb-1.5">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-2.5 font-sans">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      adjustType === 'CREDIT'
                        ? 'bg-[#f0fdf4] border-[#16a34a] text-[#16a34a] font-bold shadow-xs'
                        : 'bg-white border-[#e5e5e5] text-[#374151]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="adjustType"
                      value="CREDIT"
                      checked={adjustType === 'CREDIT'}
                      onChange={() => setAdjustType('CREDIT')}
                      className="accent-[#16a34a]"
                    />
                    <PlusCircle size={14} /> Add Credit
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      adjustType === 'DEBIT'
                        ? 'bg-[#fef2f2] border-[#dc2626] text-[#dc2626] font-bold shadow-xs'
                        : 'bg-white border-[#e5e5e5] text-[#374151]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="adjustType"
                      value="DEBIT"
                      checked={adjustType === 'DEBIT'}
                      onChange={() => setAdjustType('DEBIT')}
                      className="accent-[#dc2626]"
                    />
                    <MinusCircle size={14} /> Deduct Amount
                  </label>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-[10px] text-[#6b7280] uppercase font-bold block mb-1">
                  Amount (₹) <span className="text-[#dc2626]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[#9ca3af] font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    required
                    className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              {/* Reason Textarea */}
              <div>
                <label className="text-[10px] text-[#6b7280] uppercase font-bold block mb-1">
                  Reason for Adjustment <span className="text-[#dc2626]">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g., Manual correction for payment issue, duplicate credit reversal, or customer support gesture..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  required
                  className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl p-3 text-xs font-sans text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5e5e5]">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border border-[#e5e5e5] rounded-xl text-xs font-mono font-bold uppercase text-[#6b7280] hover:text-[#111111] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  Review &amp; Confirm →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── STEP 2: CONFIRMATION MODAL ── */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto font-sans">
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-[#111111]">
            <div className="flex items-center gap-2 border-b border-[#e5e5e5] pb-3 text-[#d97706]">
              <AlertTriangle size={20} />
              <h3 className="font-bold text-sm uppercase text-[#111111]">
                Confirm Wallet Adjustment
              </h3>
            </div>

            <div className="space-y-2.5 bg-[#f9fafb] p-4 rounded-xl border border-[#e5e5e5] font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-[#e5e5e5]">
                <span className="text-[#6b7280]">Customer User</span>
                <span className="font-bold text-[#111111] font-sans">{u.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e5e5e5]">
                <span className="text-[#6b7280]">Current Balance</span>
                <span className="font-bold text-[#111111]">₹{currentWalletBal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e5e5e5]">
                <span className="text-[#6b7280]">Action</span>
                <span className={`font-bold ${adjustType === 'CREDIT' ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                  {adjustType === 'CREDIT' ? 'ADD CREDIT' : 'DEDUCT AMOUNT'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e5e5e5]">
                <span className="text-[#6b7280]">Adjustment Amount</span>
                <span className="font-extrabold text-sm text-[#111111]">₹{parsedAmt.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e5e5e5]">
                <span className="text-[#6b7280]">Projected New Balance</span>
                <span className="font-extrabold text-sm text-[#d97706]">₹{simulatedNewBal.toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-1">
                <span className="text-[#6b7280] block text-[10px] uppercase font-bold mb-0.5">Reason</span>
                <p className="text-xs text-[#111111] font-sans italic bg-white p-2 rounded-lg border border-[#e5e5e5]">
                  "{adjustReason}"
                </p>
              </div>
            </div>

            <p className="text-[11px] text-[#6b7280] font-sans">
              This operation will atomically update the user's wallet balance, insert a permanent audit log, and dispatch an account notification.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5e5e5] font-mono">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={adjustSubmitting}
                className="px-4 py-2 border border-[#e5e5e5] rounded-xl text-xs font-bold uppercase text-[#6b7280] hover:text-[#111111] cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAdjustment}
                disabled={adjustSubmitting}
                className="px-5 py-2 btn-gold rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {adjustSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Adjustment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

