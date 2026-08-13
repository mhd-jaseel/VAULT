import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  Users,
  PlusCircle,
  CheckSquare,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Eye,
  RefreshCw,
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salesRange, setSalesRange] = useState('this_month');
  const [salesSummary, setSalesSummary] = useState(null);
  const [salesLoading, setSalesLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesOverview = async (range) => {
    setSalesLoading(true);
    try {
      const res = await axios.get(`/sales/report?range=${range}`);
      if (res.data.success) {
        setSalesSummary(res.data.data.summary);
      }
    } catch (err) {
      console.error('Error fetching sales overview:', err);
    } finally {
      setSalesLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchSalesOverview(salesRange);
  }, [salesRange]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-2 border-[#111111] border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-mono text-[#6b7280]">Loading Control Center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto text-[#111111]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#e5e5e5]">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-[#111111] font-sans">
            Admin Control Center
          </h1>
          <p className="text-xs text-[#6b7280] font-mono mt-1">
            Monitor operational metrics, verify payments, and manage catalog.
          </p>
        </div>

        <button
          onClick={() => {
            fetchStats();
            fetchSalesOverview(salesRange);
          }}
          className="self-start md:self-auto text-xs font-mono font-bold uppercase tracking-wider text-[#374151] hover:text-[#111111] bg-white border border-[#e5e5e5] hover:bg-[#f9fafb] px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw size={13} /> Refresh Feeds
        </button>
      </div>

      {/* 1. TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl space-y-3 shadow-xs hover:border-[#d1d5db] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-extrabold text-[#6b7280] uppercase tracking-widest">
              Total Revenue
            </span>
            <DollarSign className="text-[#111111]" size={16} />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold font-mono text-[#111111] tracking-tight">
              ₹{stats?.revenue?.toLocaleString('en-IN') || 0}
            </h3>
            <p className="text-[10px] text-[#16a34a] font-mono font-bold mt-1 uppercase">
              Captured &amp; Completed Orders
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl space-y-3 shadow-xs hover:border-[#d1d5db] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-extrabold text-[#6b7280] uppercase tracking-widest">
              Total Orders
            </span>
            <ShoppingBag className="text-[#111111]" size={16} />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold font-mono text-[#111111] tracking-tight">
              {stats?.totalOrders || 0}
            </h3>
            <p className="text-[10px] text-[#6b7280] font-mono mt-1 uppercase">
              <strong className="text-[#111111] font-bold">{stats?.pendingOrders || 0}</strong> pending fulfillment
            </p>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl space-y-3 shadow-xs hover:border-[#d1d5db] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-extrabold text-[#6b7280] uppercase tracking-widest">
              Pending Payments
            </span>
            <Clock className="text-[#111111]" size={16} />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold font-mono text-[#111111] tracking-tight">
              {stats?.pendingPayments || 0}
            </h3>
            <Link
              to="/admin/payments"
              className="text-[10px] text-[#d97706] font-mono font-bold hover:underline mt-1 block uppercase"
            >
              Action Required →
            </Link>
          </div>
        </div>

        {/* Registered Customers */}
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl space-y-3 shadow-xs hover:border-[#d1d5db] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-extrabold text-[#6b7280] uppercase tracking-widest">
              Registered Clients
            </span>
            <Users className="text-[#111111]" size={16} />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold font-mono text-[#111111] tracking-tight">
              {stats?.customers || 0}
            </h3>
            <p className="text-[10px] text-[#6b7280] font-mono mt-1 uppercase">
              Active Member Accounts
            </p>
          </div>
        </div>
      </div>

      {/* 2. SALES OVERVIEW SECTION WITH RANGE FILTERS */}
      <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e5e5] pb-4">
          <div>
            <h3 className="text-sm font-extrabold font-mono uppercase text-[#111111] tracking-wide">
              Sales Overview
            </h3>
            <p className="text-xs text-[#6b7280] font-mono mt-0.5">
              Net revenue breakdown after returns and discounts.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#f9fafb] p-1 rounded-xl border border-[#e5e5e5]">
            {[
              { label: 'Today', value: 'today' },
              { label: 'This Week', value: 'this_week' },
              { label: 'This Month', value: 'this_month' },
              { label: 'This Year', value: 'this_year' },
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => setSalesRange(btn.value)}
                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all ${
                  salesRange === btn.value
                    ? 'bg-[#111111] text-white font-extrabold shadow-xs'
                    : 'text-[#6b7280] hover:text-[#111111]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {salesLoading ? (
          <div className="py-8 text-center text-xs font-mono text-[#6b7280]">Loading sales analytics...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 font-mono">
            <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e5e5]">
              <span className="text-[9px] text-[#6b7280] uppercase font-bold block">Gross Sales</span>
              <span className="text-lg font-extrabold text-[#111111] mt-1 block">₹{salesSummary?.grossSales?.toLocaleString('en-IN') || 0}</span>
            </div>
            <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e5e5]">
              <span className="text-[9px] text-[#6b7280] uppercase font-bold block">Orders Count</span>
              <span className="text-lg font-extrabold text-[#111111] mt-1 block">{salesSummary?.totalOrders || 0}</span>
            </div>
            <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e5e5]">
              <span className="text-[9px] text-[#6b7280] uppercase font-bold block">Discounts Given</span>
              <span className="text-lg font-extrabold text-[#d97706] mt-1 block">₹{salesSummary?.totalDiscount?.toLocaleString('en-IN') || 0}</span>
            </div>
            <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e5e5]">
              <span className="text-[9px] text-[#6b7280] uppercase font-bold block">Refunded Returns</span>
              <span className="text-lg font-extrabold text-[#dc2626] mt-1 block">₹{salesSummary?.totalRefunds?.toLocaleString('en-IN') || 0}</span>
            </div>
            <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e5e5]">
              <span className="text-[9px] text-[#6b7280] uppercase font-bold block">Net Revenue</span>
              <span className="text-lg font-extrabold text-[#16a34a] mt-1 block">₹{salesSummary?.netRevenue?.toLocaleString('en-IN') || 0}</span>
            </div>
            <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e5e5]">
              <span className="text-[9px] text-[#6b7280] uppercase font-bold block">Avg Order Value</span>
              <span className="text-lg font-extrabold text-[#111111] mt-1 block">₹{salesSummary?.averageOrderValue?.toLocaleString('en-IN') || 0}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. QUICK MANAGEMENT ACTIONS */}
      <div>
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6b7280] mb-3">
          Quick Management Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
          <Link
            to="/admin/orders"
            className="bg-white border border-[#e5e5e5] hover:border-[#111111] p-4 rounded-xl flex items-center justify-between transition-all group shadow-xs hover:bg-[#f9fafb]"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag size={16} className="text-[#6b7280] group-hover:text-[#111111]" />
              <span className="text-xs font-bold text-[#111111] uppercase">Manage Orders</span>
            </div>
            <ChevronRight size={14} className="text-[#9ca3af] group-hover:text-[#111111]" />
          </Link>

          <Link
            to="/admin/products"
            className="bg-white border border-[#e5e5e5] hover:border-[#111111] p-4 rounded-xl flex items-center justify-between transition-all group shadow-xs hover:bg-[#f9fafb]"
          >
            <div className="flex items-center gap-3">
              <PlusCircle size={16} className="text-[#6b7280] group-hover:text-[#111111]" />
              <span className="text-xs font-bold text-[#111111] uppercase">Add Product</span>
            </div>
            <ChevronRight size={14} className="text-[#9ca3af] group-hover:text-[#111111]" />
          </Link>

          <Link
            to="/admin/payments"
            className="bg-white border border-[#e5e5e5] hover:border-[#111111] p-4 rounded-xl flex items-center justify-between transition-all group shadow-xs hover:bg-[#f9fafb]"
          >
            <div className="flex items-center gap-3">
              <CheckSquare size={16} className="text-[#6b7280] group-hover:text-[#111111]" />
              <span className="text-xs font-bold text-[#111111] uppercase">Verify Payments</span>
            </div>
            <ChevronRight size={14} className="text-[#9ca3af] group-hover:text-[#111111]" />
          </Link>

          <Link
            to="/admin/sales-report"
            className="bg-white border border-[#e5e5e5] hover:border-[#111111] p-4 rounded-xl flex items-center justify-between transition-all group shadow-xs hover:bg-[#f9fafb]"
          >
            <div className="flex items-center gap-3">
              <TrendingUp size={16} className="text-[#6b7280] group-hover:text-[#111111]" />
              <span className="text-xs font-bold text-[#111111] uppercase">Sales Report</span>
            </div>
            <ChevronRight size={14} className="text-[#9ca3af] group-hover:text-[#111111]" />
          </Link>
        </div>
      </div>

      {/* 4. RECENT ORDERS & INVENTORY ALERTS (2-COLUMN LAYOUT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT ORDERS FEED */}
        <div className="lg:col-span-2 bg-white border border-[#e5e5e5] p-6 rounded-2xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-4">
            <h3 className="text-sm font-extrabold font-mono uppercase text-[#111111] tracking-wide">
              Recent Orders
            </h3>
            <Link
              to="/admin/orders"
              className="text-xs font-mono font-bold uppercase text-[#d97706] hover:underline"
            >
              View All Orders →
            </Link>
          </div>

          {!stats?.recentOrders || stats.recentOrders.length === 0 ? (
            <p className="text-xs font-mono text-[#6b7280] py-6 text-center">No orders recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#e5e5e5] text-[#6b7280] uppercase text-[10px] bg-[#f9fafb]">
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]">
                  {stats.recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-[#f9fafb]">
                      <td className="p-3 font-bold text-[#111111] select-all">
                        #{order._id.toString().slice(-6).toUpperCase()}
                      </td>
                      <td className="p-3 text-[#374151] font-sans font-medium">{order.user?.name || 'Customer'}</td>
                      <td className="p-3 font-bold text-[#111111]">₹{order.grandTotal?.toLocaleString('en-IN')}</td>
                      <td className="p-3">
                        <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          order.paymentStatus === 'captured' || order.paymentStatus === 'authorized'
                            ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]'
                            : order.paymentStatus === 'failed'
                            ? 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]'
                            : 'bg-[#fffbeb] border-[#fde68a] text-[#d97706]'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-[9px] font-bold uppercase text-[#374151] bg-[#f3f4f6] px-2 py-0.5 rounded-md border border-[#e5e5e5]">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* REDESIGNED INVENTORY ALERTS */}
        <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-4">
            <h3 className="text-sm font-extrabold font-mono uppercase text-[#111111] tracking-wide flex items-center gap-2">
              <AlertTriangle size={15} className="text-[#d97706]" /> Stock Alerts
            </h3>
            <Link to="/admin/products" className="text-xs font-mono font-bold text-[#6b7280] hover:text-[#111111]">
              Catalog →
            </Link>
          </div>

          {!stats?.lowStockProducts || stats.lowStockProducts.length === 0 ? (
            <div className="text-center py-8 text-xs font-mono text-[#6b7280]">
              All product stock levels are healthy!
            </div>
          ) : (
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 font-mono">
              {stats.lowStockProducts.map((prod) => {
                const stockState =
                  prod.stock === 0
                    ? { label: 'OUT OF STOCK', cls: 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]' }
                    : prod.stock < 5
                    ? { label: 'LOW STOCK', cls: 'bg-[#fffbeb] border-[#fde68a] text-[#d97706]' }
                    : { label: 'HEALTHY', cls: 'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]' };

                return (
                  <div
                    key={prod._id}
                    className="p-3 bg-[#f9fafb] border border-[#e5e5e5] rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-[#111111] truncate font-sans uppercase">{prod.name}</p>
                      <p className="text-[9px] text-[#6b7280]">{prod.category?.name || 'Accessories'}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border ${stockState.cls}`}>
                        {prod.stock} units left
                      </span>
                      <Link
                        to={`/admin/products?edit=${prod._id}`}
                        className="text-[9px] text-[#d97706] font-bold hover:underline block mt-1 uppercase"
                      >
                        Restock
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
