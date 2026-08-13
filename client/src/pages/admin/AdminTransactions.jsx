import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
} from 'lucide-react';
import AdminDetailsDrawer from '../../components/admin/AdminDetailsDrawer';
import TransactionDetailsView from '../../components/admin/drawers/TransactionDetailsView';
import CustomerDetailsView from '../../components/admin/drawers/CustomerDetailsView';
import OrderDetailsView from '../../components/admin/drawers/OrderDetailsView';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [typeFilter, setTypeFilter] = useState('all');
  const [rangeFilter, setRangeFilter] = useState('all');
  const [sortOption, setSortOption] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick View Drawer state
  const [drawer, setDrawer] = useState({ isOpen: false, type: null, entityId: null, data: null, title: '' });

  const openDrawer = (type, entityId, title, data = null) => {
    setDrawer({ isOpen: true, type, entityId, title, data });
  };

  const closeDrawer = () => {
    setDrawer({ isOpen: false, type: null, entityId: null, data: null, title: '' });
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/wallet/admin/all?page=${page}&limit=15&type=${typeFilter}&range=${rangeFilter}&sort=${sortOption}&search=${encodeURIComponent(
          searchQuery
        )}`
      );

      if (res.data.success) {
        setTransactions(res.data.data);
        setSummary(res.data.summary);
        setTotalPages(res.data.pagination.pages);
        setTotalCount(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Error fetching admin transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, typeFilter, rangeFilter, sortOption]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const getTransactionTypeBadge = (type) => {
    if (type === 'RETURN_REPLACEMENT_CREDIT') {
      return (
        <span className="text-[9px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]">
          Credit / Refund
        </span>
      );
    } else if (type === 'REPLACEMENT_DEBIT' || type === 'ORDER_WALLET_PAYMENT') {
      return (
        <span className="text-[9px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border bg-[#fef2f2] border-[#fecaca] text-[#dc2626]">
          Debit / Payment
        </span>
      );
    } else if (type === 'ADJUSTMENT') {
      return (
        <span className="text-[9px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border bg-[#fffbeb] border-[#fde68a] text-[#d97706]">
          Adjustment
        </span>
      );
    }
    return (
      <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border bg-[#f3f4f6] border-[#e5e5e5] text-[#374151]">
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto text-[#111111]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e5e5e5]">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-[#111111]">
            Wallet &amp; Financial Transactions
          </h1>
          <p className="text-xs text-[#6b7280] font-mono mt-1">
            Monitor wallet activity, refunds, credits, and debits.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          className="self-start sm:self-auto text-xs font-mono font-bold uppercase tracking-wider text-[#374151] hover:text-[#111111] bg-white border border-[#e5e5e5] hover:bg-[#f9fafb] px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw size={13} /> Refresh Transactions
        </button>
      </div>

      {/* 1. SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* Total Transactions */}
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-[#6b7280] uppercase tracking-widest">
              Total Transactions
            </span>
            <Wallet className="text-[#111111]" size={16} />
          </div>
          <h3 className="text-2xl font-extrabold text-[#111111]">
            {summary?.totalTransactions || 0}
          </h3>
          <p className="text-[10px] text-[#6b7280] uppercase">System Financial Activity</p>
        </div>

        {/* Total Credits */}
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-[#6b7280] uppercase tracking-widest">
              Total Credits
            </span>
            <TrendingUp className="text-[#16a34a]" size={16} />
          </div>
          <h3 className="text-2xl font-extrabold text-[#16a34a]">
            + ₹{summary?.totalCredits?.toLocaleString('en-IN') || 0}
          </h3>
          <p className="text-[10px] text-[#16a34a] font-bold uppercase">Store Credit Issued</p>
        </div>

        {/* Total Debits */}
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-[#6b7280] uppercase tracking-widest">
              Total Debits
            </span>
            <TrendingDown className="text-[#dc2626]" size={16} />
          </div>
          <h3 className="text-2xl font-extrabold text-[#dc2626]">
            - ₹{summary?.totalDebits?.toLocaleString('en-IN') || 0}
          </h3>
          <p className="text-[10px] text-[#dc2626] font-bold uppercase">Wallet Payments Redeemed</p>
        </div>

        {/* Total Refunds */}
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-[#6b7280] uppercase tracking-widest">
              Total Refunds
            </span>
            <RotateCcw className="text-[#d97706]" size={16} />
          </div>
          <h3 className="text-2xl font-extrabold text-[#d97706]">
            ₹{summary?.totalRefunds?.toLocaleString('en-IN') || 0}
          </h3>
          <p className="text-[10px] text-[#d97706] font-bold uppercase">Approved Return Credits</p>
        </div>
      </div>

      {/* 2. FILTERS & SEARCH TOOLBAR */}
      <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl space-y-4 shadow-xs font-mono">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by Transaction ID, Reference ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-[#111111]"
            />
            <Search size={14} className="absolute left-3 top-3 text-[#9ca3af]" />
          </form>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Type Filter */}
            <div className="flex items-center gap-1.5 bg-[#f9fafb] border border-[#e5e5e5] px-3 py-1.5 rounded-xl">
              <span className="text-[#6b7280] text-[10px] uppercase font-bold">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-[#111111] font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All Types</option>
                <option value="CREDIT">Credits / Refunds</option>
                <option value="DEBIT">Debits / Payments</option>
                <option value="ADJUSTMENT">Adjustments</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-1.5 bg-[#f9fafb] border border-[#e5e5e5] px-3 py-1.5 rounded-xl">
              <span className="text-[#6b7280] text-[10px] uppercase font-bold">Date:</span>
              <select
                value={rangeFilter}
                onChange={(e) => {
                  setRangeFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-[#111111] font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="this_year">This Year</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-1.5 bg-[#f9fafb] border border-[#e5e5e5] px-3 py-1.5 rounded-xl">
              <span className="text-[#6b7280] text-[10px] uppercase font-bold">Sort:</span>
              <select
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-[#111111] font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TRANSACTION TABLE */}
      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 space-y-4 shadow-xs font-mono">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
          <h3 className="text-sm font-extrabold uppercase text-[#111111] tracking-wide">
            Transaction Activity Feed
          </h3>
          <span className="text-xs text-[#6b7280]">Showing {transactions.length} of {totalCount} transactions</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-[#6b7280] flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#111111] border-t-transparent animate-spin mb-2" />
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-xs text-[#6b7280]">
            <p className="font-bold text-[#111111] text-sm mb-1">No transactions found.</p>
            <p>Transactions will appear here when wallet or payment activity occurs.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#e5e5e5] text-[#6b7280] uppercase text-[10px] bg-[#f9fafb]">
                    <th className="p-3">Transaction ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date &amp; Time</th>
                    <th className="p-3 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]">
                  {transactions.map((txn) => {
                    const isCredit = txn.type === 'RETURN_REPLACEMENT_CREDIT' || (txn.type === 'ADJUSTMENT' && txn.amount > 0);

                    return (
                      <tr key={txn._id} className="hover:bg-[#f9fafb] transition-colors">
                        <td className="p-3 font-bold text-[#111111] select-all">
                          <span
                            onClick={() => openDrawer('TRANSACTION', txn._id, 'Transaction Details', txn)}
                            className="cursor-pointer hover:text-gold hover:underline transition-colors"
                          >
                            {txn.transactionId}
                          </span>
                        </td>
                        <td className="p-3 font-sans">
                          {txn.user ? (
                            <button 
                              onClick={() => openDrawer('CUSTOMER', txn.user._id, 'Customer Details')}
                              className="text-left cursor-pointer hover:underline focus:outline-none group"
                            >
                              <p className="font-bold text-[#111111] text-xs group-hover:text-gold transition-colors">{txn.user.name}</p>
                              <p className="text-[10px] text-[#6b7280] font-mono">{txn.user.email}</p>
                            </button>
                          ) : (
                            <span className="text-zinc-500 italic">—</span>
                          )}
                        </td>
                        <td className="p-3">{getTransactionTypeBadge(txn.type)}</td>
                        <td className={`p-3 font-extrabold text-sm ${isCredit ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                          <span
                            onClick={() => openDrawer('TRANSACTION', txn._id, 'Transaction Details', txn)}
                            className="cursor-pointer hover:opacity-80 hover:underline decoration-dashed transition-all"
                          >
                            {isCredit ? '+' : '-'} ₹{Math.abs(txn.amount)?.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="p-3 uppercase text-[10px] text-[#374151] font-bold">
                          {txn.referenceType === 'ORDER' ? (
                            <button
                              onClick={() => openDrawer('ORDER', txn.referenceId, `Order #${txn.referenceId.slice(-6).toUpperCase()}`)}
                              className="cursor-pointer hover:text-gold hover:underline transition-colors"
                            >
                              Order #{txn.referenceId.slice(-6)}
                            </button>
                          ) : (
                            <>{txn.referenceType || 'Wallet'} #{txn.referenceId || 'N/A'}</>
                          )}
                        </td>
                        <td className="p-3">
                          <span 
                            onClick={() => openDrawer('TRANSACTION', txn._id, 'Transaction Details', txn)}
                            className="text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a] cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            Completed
                          </span>
                        </td>
                        <td className="p-3 text-[10px] text-[#6b7280]">
                          {new Date(txn.createdAt).toLocaleDateString('en-IN')}{' '}
                          <span className="text-[#9ca3af]">{new Date(txn.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-[#9ca3af] italic text-[10px]"></span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-between border-t border-[#e5e5e5] pt-4 font-mono text-xs text-[#6b7280]">
              <span>
                Showing page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-white border border-[#e5e5e5] rounded-xl hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft size={13} /> Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 bg-white border border-[#e5e5e5] rounded-xl hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* REUSABLE DETAILS DRAWER */}
      <AdminDetailsDrawer
        isOpen={drawer.isOpen}
        onClose={closeDrawer}
        title={drawer.title}
        subtitle="Quick View"
      >
        {drawer.isOpen && drawer.type === 'TRANSACTION' && <TransactionDetailsView transaction={drawer.data} />}
        {drawer.isOpen && drawer.type === 'ORDER' && <OrderDetailsView orderId={drawer.entityId} />}
        {drawer.isOpen && drawer.type === 'CUSTOMER' && <CustomerDetailsView customerId={drawer.entityId} />}
      </AdminDetailsDrawer>
    </div>
  );
}
