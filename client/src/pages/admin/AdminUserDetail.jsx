import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { PremiumSwal } from '../../utils/swalHelper';
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
} from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Orders tab
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPages, setOrdersPages] = useState(1);

  // Block action
  const [blocking, setBlocking] = useState(false);

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
    fetchOrders(1);
  }, [id]);

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
        await fetchUser();
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
        await fetchUser();
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

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen">
      {/* Back */}
      <Link
        to="/admin/users"
        className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors font-mono text-[10px] mb-6 tracking-wider"
      >
        <ArrowLeft size={12} /> BACK TO USERS
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT: Profile Card ── */}
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

        {/* ── RIGHT: Stats + Orders ── */}
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

          {/* Order History */}
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

          {/* Return History */}
          <div className="glass-card flex flex-col gap-4">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3">
              Return History
            </h3>
            <div className="text-center py-8">
              <p className="text-[10px] text-text-secondary font-mono">No return history found for this user.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
