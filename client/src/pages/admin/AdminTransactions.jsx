import React, { useEffect, useState, useRef } from 'react';
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
  Check,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import AdminDetailsDrawer from '../../components/admin/AdminDetailsDrawer';
import TransactionDetailsView from '../../components/admin/drawers/TransactionDetailsView';
import CustomerDetailsView from '../../components/admin/drawers/CustomerDetailsView';
import OrderDetailsView from '../../components/admin/drawers/OrderDetailsView';

import VaultSelect from '../../components/VaultSelect';

// Filter & Sort Options
const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'CREDIT', label: 'Credits (+)' },
  { value: 'DEBIT', label: 'Debits (-)' },
  { value: 'RETURN_CREDIT', label: 'Return Refunds' },
  { value: 'CANCELLATION_CREDIT', label: 'Cancellation Refunds' },
  { value: 'ORDER_PAYMENT', label: 'Order Payments' },
  { value: 'ADMIN_ADJUSTMENT', label: 'Admin Adjustments' },
];

const RANGE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_year', label: 'This Year' },
];

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest', label: 'Highest Amount' },
  { value: 'lowest', label: 'Lowest Amount' },
];

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

  // Mobile Drawers
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);

  // Temp filter state for mobile drawer
  const [tempType, setTempType] = useState(typeFilter);
  const [tempRange, setTempRange] = useState(rangeFilter);

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

  // Lock background scroll when mobile drawers are open
  useEffect(() => {
    if (isMobileFilterOpen || isMobileSortOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileFilterOpen, isMobileSortOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(1);
  };

  const handleResetFilters = () => {
    setTypeFilter('all');
    setRangeFilter('all');
    setSortOption('latest');
    setSearchQuery('');
    setPage(1);
    setTempType('all');
    setTempRange('all');
    setIsMobileFilterOpen(false);
    setIsMobileSortOpen(false);
  };

  const handleOpenMobileFilter = () => {
    setTempType(typeFilter);
    setTempRange(rangeFilter);
    setIsMobileFilterOpen(true);
  };

  const handleApplyMobileFilter = () => {
    setTypeFilter(tempType);
    setRangeFilter(tempRange);
    setPage(1);
    setIsMobileFilterOpen(false);
  };

  const handleSelectSort = (val) => {
    setSortOption(val);
    setPage(1);
    setIsMobileSortOpen(false);
  };

  const activeFiltersCount = [
    typeFilter !== 'all',
    rangeFilter !== 'all',
    Boolean(searchQuery.trim()),
  ].filter(Boolean).length;

  const isFiltered = activeFiltersCount > 0 || sortOption !== 'latest';

  const getTransactionTypeBadge = (txn) => {
    const isCredit = txn.type === 'CREDIT';
    const source = txn.source;

    let label = isCredit ? 'Credit' : 'Debit';
    if (source === 'RETURN_CREDIT') label = 'Return Refund';
    else if (source === 'CANCELLATION_CREDIT') label = 'Cancel Refund';
    else if (source === 'ORDER_PAYMENT') label = 'Order Payment';
    else if (source === 'ADMIN_ADJUSTMENT') label = 'Admin Adjustment';
    else if (source === 'REPLACEMENT_FALLBACK_CREDIT') label = 'Replacement Refund';

    if (isCredit) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a] whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
          {label}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border bg-[#fef2f2] border-[#fecaca] text-[#dc2626] whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
        {label}
      </span>
    );
  };

  const currentSortLabel = SORT_OPTIONS.find((s) => s.value === sortOption)?.label || 'Latest First';
  const currentTypeLabel = TYPE_OPTIONS.find((t) => t.value === typeFilter)?.label || 'All Types';

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto text-[#111111] min-w-0">
      {/* ── 1. PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#e5e5e5]">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-[#111111]">
            Wallet &amp; Transactions
          </h1>
          <p className="text-xs text-[#6b7280] font-mono mt-1">
            Real-time financial activity, wallet adjustments, and refund logs.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="self-start sm:self-auto text-xs font-mono font-bold uppercase tracking-wider text-[#374151] hover:text-[#111111] bg-white border border-[#e5e5e5] hover:bg-[#f9fafb] px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── 2. SUMMARY METRICS CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        {/* Total Transactions */}
        <div className="bg-white border border-[#e5e5e5] p-4 rounded-2xl space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-extrabold text-[#6b7280] uppercase tracking-wider">
              Transactions
            </span>
            <Wallet className="text-[#6b7280]" size={15} />
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#111111]">
            {summary?.totalTransactions || 0}
          </h3>
          <p className="text-[9px] text-[#6b7280] uppercase truncate">Total Activity</p>
        </div>

        {/* Total Credits */}
        <div className="bg-white border border-[#e5e5e5] p-4 rounded-2xl space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-extrabold text-[#16a34a] uppercase tracking-wider">
              Credits Issued
            </span>
            <TrendingUp className="text-[#16a34a]" size={15} />
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#16a34a]">
            +₹{summary?.totalCredits?.toLocaleString('en-IN') || 0}
          </h3>
          <p className="text-[9px] text-[#16a34a] font-bold uppercase truncate">Wallet Additions</p>
        </div>

        {/* Total Debits */}
        <div className="bg-white border border-[#e5e5e5] p-4 rounded-2xl space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-extrabold text-[#dc2626] uppercase tracking-wider">
              Debits Used
            </span>
            <TrendingDown className="text-[#dc2626]" size={15} />
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#dc2626]">
            -₹{summary?.totalDebits?.toLocaleString('en-IN') || 0}
          </h3>
          <p className="text-[9px] text-[#dc2626] font-bold uppercase truncate">Checkout Redeemed</p>
        </div>

        {/* Total Refunds */}
        <div className="bg-white border border-[#e5e5e5] p-4 rounded-2xl space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-extrabold text-[#d97706] uppercase tracking-wider">
              Total Refunds
            </span>
            <RotateCcw className="text-[#d97706]" size={15} />
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#d97706]">
            ₹{summary?.totalRefunds?.toLocaleString('en-IN') || 0}
          </h3>
          <p className="text-[9px] text-[#d97706] font-bold uppercase truncate">Returns / Cancel</p>
        </div>
      </div>

      {/* ── 3. MOBILE CONTROLS & SEARCH (< md) ── */}
      <div className="md:hidden space-y-3 font-mono">
        {/* Mobile Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search size={14} className="absolute left-3 top-3 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="Search TXN ID, order reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#e5e5e5] rounded-xl pl-9 pr-8 py-2 text-xs text-[#111111] placeholder-[#9ca3af] focus:outline-none focus:border-[#111111]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-2.5 text-[#9ca3af] hover:text-[#111111] cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </form>

        {/* Compact Sort & Filter Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setIsMobileSortOpen(true)}
            className="flex items-center justify-between px-3 py-2 bg-white border border-[#e5e5e5] rounded-xl text-xs font-bold text-[#111111] hover:bg-[#f9fafb] cursor-pointer shadow-xs"
          >
            <span className="flex items-center gap-1.5 truncate">
              <ArrowUpDown size={12} className="text-[#6b7280]" />
              <span className="text-[10px] uppercase text-[#6b7280]">SORT:</span>
              <span className="truncate">{currentSortLabel}</span>
            </span>
          </button>

          <button
            onClick={handleOpenMobileFilter}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer shadow-xs ${
              activeFiltersCount > 0
                ? 'bg-[#111111] text-white border-[#111111]'
                : 'bg-white text-[#111111] border-[#e5e5e5] hover:bg-[#f9fafb]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Filter size={12} className={activeFiltersCount > 0 ? 'text-amber-400' : 'text-[#6b7280]'} />
              <span>FILTER</span>
            </span>
            {activeFiltersCount > 0 ? (
              <span className="bg-amber-400 text-[#111111] text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                {activeFiltersCount}
              </span>
            ) : (
              <span className="text-[10px] text-[#6b7280] uppercase truncate">
                {currentTypeLabel}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Result Count & Clear shortcut */}
        <div className="flex items-center justify-between text-[11px] text-[#6b7280] px-1">
          <span>
            {loading ? 'Updating...' : `Showing ${transactions.length} of ${totalCount} transactions`}
          </span>
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="text-[#dc2626] hover:underline font-bold text-[10px] uppercase cursor-pointer flex items-center gap-1"
            >
              <RotateCcw size={10} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* ── 4. DESKTOP FILTERS & SEARCH TOOLBAR (md and up) ── */}
      <div className="hidden md:flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 border border-[#e5e5e5] rounded-2xl shadow-xs font-mono text-xs">
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={14} className="absolute left-3 top-2.5 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="Search TXN ID, reference, admin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl pl-9 pr-8 py-1.5 text-xs text-[#111111] placeholder-[#9ca3af] focus:bg-white focus:outline-none focus:border-[#111111]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-2 text-[#9ca3af] hover:text-[#111111] cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </form>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <VaultSelect
            label="Type:"
            value={typeFilter}
            onChange={(val) => {
              setTypeFilter(val);
              setPage(1);
            }}
            options={TYPE_OPTIONS}
          />

          {/* Date Range Filter */}
          <VaultSelect
            label="Date:"
            value={rangeFilter}
            onChange={(val) => {
              setRangeFilter(val);
              setPage(1);
            }}
            options={RANGE_OPTIONS}
          />

          {/* Sort Filter */}
          <VaultSelect
            label="Sort:"
            value={sortOption}
            onChange={(val) => {
              setSortOption(val);
              setPage(1);
            }}
            options={SORT_OPTIONS}
          />

          {/* Clear Button */}
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] rounded-xl text-xs font-bold hover:bg-[#fee2e2] transition-colors cursor-pointer flex items-center gap-1"
              title="Reset all filters"
            >
              <RotateCcw size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── 5. TRANSACTION ACTIVITY FEED / CARDS ── */}
      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs font-mono">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
          <h3 className="text-xs sm:text-sm font-extrabold uppercase text-[#111111] tracking-wide">
            Transaction Activity Feed
          </h3>
          <span className="text-[11px] text-[#6b7280]">
            Showing {transactions.length} of {totalCount} transactions
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-[#6b7280] flex flex-col items-center justify-center font-mono">
            <div className="w-8 h-8 rounded-full border-2 border-[#111111] border-t-transparent animate-spin mb-2" />
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[#f9fafb] border border-[#e5e5e5] rounded-2xl font-mono space-y-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#e5e5e5] flex items-center justify-center mx-auto text-[#6b7280]">
              <Wallet size={18} />
            </div>
            <p className="font-bold text-[#111111] text-xs uppercase tracking-wide">No transactions found</p>
            <p className="text-[11px] text-[#6b7280] max-w-sm mx-auto">
              {isFiltered
                ? 'No financial records match your selected filters. Try changing or resetting them.'
                : 'Transactions will appear here when wallet or payment activity occurs.'}
            </p>
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="mt-2 px-3 py-1.5 bg-[#111111] text-white hover:bg-black rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#e5e5e5] text-[#6b7280] uppercase text-[10px] bg-[#f9fafb]">
                    <th className="p-3">Transaction ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Balance After</th>
                    <th className="p-3">Reference / Source</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date &amp; Time</th>
                    <th className="p-3 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]">
                  {transactions.map((txn) => {
                    const isCredit = txn.type === 'CREDIT';

                    return (
                      <tr key={txn._id} className="hover:bg-[#f9fafb] transition-colors group">
                        <td className="p-3 font-bold text-[#111111]">
                          <span
                            onClick={() => openDrawer('TRANSACTION', txn._id, 'Transaction Details', txn)}
                            className="cursor-pointer hover:text-[#d97706] hover:underline transition-colors font-mono text-[11px]"
                          >
                            {txn.transactionId}
                          </span>
                        </td>
                        <td className="p-3 font-sans max-w-[150px]">
                          {txn.user ? (
                            <div
                              onClick={() => openDrawer('CUSTOMER', txn.user._id, 'Customer Details')}
                              className="cursor-pointer hover:bg-[#f3f4f6] px-1.5 py-1 -ml-1.5 rounded transition-colors inline-block max-w-full"
                            >
                              <p className="font-bold text-[#111111] text-xs truncate" title={txn.user.name}>{txn.user.name}</p>
                              <p className="text-[10px] text-[#6b7280] font-mono truncate" title={txn.user.email}>{txn.user.email}</p>
                            </div>
                          ) : (
                            <span className="text-[#9ca3af] italic">—</span>
                          )}
                        </td>
                        <td className="p-3">{getTransactionTypeBadge(txn)}</td>
                        <td className={`p-3 font-extrabold text-xs sm:text-sm ${isCredit ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                          <span
                            onClick={() => openDrawer('TRANSACTION', txn._id, 'Transaction Details', txn)}
                            className="cursor-pointer hover:opacity-80 hover:underline decoration-dashed transition-all"
                          >
                            {isCredit ? '+' : '-'}₹{Math.abs(txn.amount)?.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-xs text-[#374151]">
                          ₹{(txn.balanceAfter || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 uppercase text-[10px] text-[#374151] font-bold max-w-[140px]">
                          {txn.source === 'ORDER_PAYMENT' || txn.referenceId?.startsWith?.('6') ? (
                            <button
                              onClick={() => openDrawer('ORDER', txn.referenceId, `Order #${txn.referenceId?.slice(-6).toUpperCase()}`)}
                              className="cursor-pointer hover:text-[#d97706] hover:underline transition-colors truncate block text-left"
                            >
                              Order #{txn.referenceId?.slice(-6).toUpperCase()}
                            </button>
                          ) : (
                            <span className="truncate block font-mono text-[10px] text-[#6b7280]">
                              {txn.source?.replace(/_/g, ' ') || txn.referenceId || 'WALLET'}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span 
                            onClick={() => openDrawer('TRANSACTION', txn._id, 'Transaction Details', txn)}
                            className="text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a] cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center gap-1"
                          >
                            <Check size={9} /> Completed
                          </span>
                        </td>
                        <td className="p-3 text-[10px] text-[#6b7280]">
                          <span className="block">{new Date(txn.createdAt).toLocaleDateString('en-IN')}</span>
                          <span className="text-[#9ca3af] text-[9px]">{new Date(txn.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => openDrawer('TRANSACTION', txn._id, 'Transaction Details', txn)}
                            className="px-2.5 py-1 bg-white border border-[#e5e5e5] hover:bg-[#f9fafb] rounded-lg text-[#111111] cursor-pointer text-[10px] font-bold uppercase shadow-xs flex items-center gap-1 ml-auto"
                          >
                            <Eye size={11} /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< md) */}
            <div className="md:hidden space-y-3">
              {transactions.map((txn) => {
                const isCredit = txn.type === 'CREDIT';

                return (
                  <div
                    key={txn._id}
                    className="bg-white border border-[#e5e5e5] rounded-2xl p-4 space-y-3 text-xs shadow-xs"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-2">
                      <button
                        onClick={() => openDrawer('TRANSACTION', txn._id, 'Transaction Details', txn)}
                        className="font-bold text-xs text-[#111111] hover:text-[#d97706] cursor-pointer font-mono"
                      >
                        {txn.transactionId}
                      </button>
                      {getTransactionTypeBadge(txn)}
                    </div>

                    {/* Customer */}
                    {txn.user && (
                      <div
                        onClick={() => openDrawer('CUSTOMER', txn.user._id, 'Customer Details')}
                        className="space-y-0.5 font-sans cursor-pointer hover:opacity-80"
                      >
                        <p className="font-bold text-xs text-[#111111]">{txn.user.name}</p>
                        <p className="text-[10px] text-[#6b7280] font-mono">{txn.user.email}</p>
                      </div>
                    )}

                    {/* Financial Metrics */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#f3f4f6] text-[11px]">
                      <div>
                        <span className="text-[9px] text-[#6b7280] uppercase block font-bold">Amount</span>
                        <span className={`font-extrabold text-sm ${isCredit ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                          {isCredit ? '+' : '-'}₹{Math.abs(txn.amount)?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#6b7280] uppercase block font-bold">Balance After</span>
                        <span className="font-bold text-[#111111]">
                          ₹{(txn.balanceAfter || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#6b7280] uppercase block font-bold">Source</span>
                        <span className="text-[10px] text-[#374151] font-bold truncate block">
                          {txn.source?.replace(/_/g, ' ') || 'WALLET'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#6b7280] uppercase block font-bold">Date</span>
                        <span className="text-[#6b7280] text-[10px]">
                          {new Date(txn.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-[#e5e5e5] flex items-center justify-between gap-2">
                      <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a] inline-flex items-center gap-1">
                        <Check size={8} /> Completed
                      </span>
                      <button
                        onClick={() => openDrawer('TRANSACTION', txn._id, 'Transaction Details', txn)}
                        className="px-3 py-1.5 bg-[#f9fafb] border border-[#e5e5e5] hover:bg-[#f3f4f6] text-[#111111] rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1"
                      >
                        <Eye size={11} /> Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-[#e5e5e5] pt-4 font-mono text-xs text-[#6b7280]">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-white border border-[#e5e5e5] rounded-xl hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <ChevronLeft size={13} /> Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 bg-white border border-[#e5e5e5] rounded-xl hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── 6. MOBILE SORT BOTTOM SHEET ── */}
      {isMobileSortOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs font-sans">
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileSortOpen(false)}
          />
          <div className="relative bg-white border border-[#e5e5e5] rounded-t-3xl sm:rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-2.5">
              <div className="flex items-center gap-2">
                <ArrowUpDown size={16} className="text-[#6b7280]" />
                <h3 className="font-bold text-sm uppercase text-[#111111]">Sort Transactions</h3>
              </div>
              <button
                onClick={() => setIsMobileSortOpen(false)}
                className="text-[#6b7280] hover:text-[#111111] p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1 font-mono text-xs">
              {SORT_OPTIONS.map((opt) => {
                const isSelected = sortOption === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleSelectSort(opt.value)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors text-left cursor-pointer ${
                      isSelected
                        ? 'bg-[#111111] text-white font-bold'
                        : 'hover:bg-[#f9fafb] text-[#374151]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={14} className="text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 7. MOBILE FILTER BOTTOM SHEET ── */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs font-sans">
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative bg-white border border-[#e5e5e5] rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#e5e5e5]">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-[#6b7280]" />
                <h3 className="font-bold text-sm uppercase text-[#111111]">Filter Transactions</h3>
              </div>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="text-[#6b7280] hover:text-[#111111] p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Options Body */}
            <div className="p-5 space-y-5 overflow-y-auto font-mono text-xs flex-1">
              {/* Type */}
              <div>
                <label className="text-[10px] text-[#6b7280] uppercase font-bold block mb-2">
                  Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-1.5 font-sans">
                  {TYPE_OPTIONS.map((opt) => {
                    const isSelected = tempType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTempType(opt.value)}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                            : 'bg-[#f9fafb] text-[#374151] border-[#e5e5e5] hover:bg-neutral-100'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && <Check size={12} className="text-amber-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="text-[10px] text-[#6b7280] uppercase font-bold block mb-2">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-1.5 font-sans">
                  {RANGE_OPTIONS.map((opt) => {
                    const isSelected = tempRange === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTempRange(opt.value)}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                            : 'bg-[#f9fafb] text-[#374151] border-[#e5e5e5] hover:bg-neutral-100'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && <Check size={12} className="text-amber-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#e5e5e5] flex items-center justify-between gap-3 font-mono">
              <button
                type="button"
                onClick={() => {
                  setTempType('all');
                  setTempRange('all');
                }}
                className="px-4 py-2.5 border border-[#e5e5e5] rounded-xl text-xs font-bold uppercase text-[#6b7280] hover:text-[#111111] cursor-pointer"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={handleApplyMobileFilter}
                className="flex-1 py-2.5 bg-[#111111] hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs text-center"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. REUSABLE DETAILS DRAWER ── */}
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
