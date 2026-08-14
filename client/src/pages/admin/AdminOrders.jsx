import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Eye,
  Edit3,
  X,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Ban,
  CheckCircle2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Calendar,
  Filter,
  Check,
  RefreshCw,
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import AdminDetailsDrawer from '../../components/admin/AdminDetailsDrawer';
import OrderDetailsView from '../../components/admin/drawers/OrderDetailsView';
import VaultSelect from '../../components/VaultSelect';

// Allowed forward transitions (strictly forward progression)
const ALLOWED_NEXT_STATUSES = {
  pending: ['confirmed'],
  confirmed: ['packed'],
  packed: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

// Allowed backward corrections
const ALLOWED_CORRECTION_TARGETS = {
  delivered: ['shipped', 'packed', 'confirmed'],
  shipped: ['packed', 'confirmed'],
  packed: ['confirmed'],
  confirmed: ['pending'],
  cancelled: [],
  pending: [],
};

// Sort options
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest_amount', label: 'Highest Amount' },
  { value: 'lowest_amount', label: 'Lowest Amount' },
  { value: 'recently_updated', label: 'Recently Updated' },
  { value: 'customer_asc', label: 'Customer Name A → Z' },
  { value: 'customer_desc', label: 'Customer Name Z → A' },
];

// Filter options
const ORDER_STATUS_OPTIONS = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'All Payments' },
  { value: 'pending', label: 'Pending' },
  { value: 'captured', label: 'Verified / Captured' },
  { value: 'cod_pending', label: 'COD Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
];

const AMOUNT_RANGE_OPTIONS = [
  { value: 'all', label: 'All Amounts' },
  { value: 'under_1000', label: 'Under ₹1,000' },
  { value: '1000_5000', label: '₹1,000 – ₹5,000' },
  { value: '5000_10000', label: '₹5,000 – ₹10,000' },
  { value: 'above_10000', label: 'Above ₹10,000' },
];

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params
  const page = Number(searchParams.get('page')) || 1;
  const currentSearch = searchParams.get('search') || '';
  const currentStatus = searchParams.get('status') || 'all';
  const currentPaymentStatus = searchParams.get('paymentStatus') || 'all';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentDateRange = searchParams.get('dateRange') || 'all';
  const currentStartDate = searchParams.get('startDate') || '';
  const currentEndDate = searchParams.get('endDate') || '';
  const currentAmountRange = searchParams.get('amountRange') || 'all';

  // Local state for search input (with debounce)
  const [searchInput, setSearchInput] = useState(currentSearch);
  const searchDebounceRef = useRef(null);

  // Filter drawer & sort dropdown states
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);

  // Temporary filter state for mobile drawer
  const [tempFilter, setTempFilter] = useState({
    status: currentStatus,
    paymentStatus: currentPaymentStatus,
    dateRange: currentDateRange,
    startDate: currentStartDate,
    endDate: currentEndDate,
    amountRange: currentAmountRange,
  });

  const [pages, setPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalSystemOrders, setTotalSystemOrders] = useState(0);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status edit modal states
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [timelineNote, setTimelineNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Status Correction modal states
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correcting, setCorrecting] = useState(false);

  // Admin Cancel Order modal states
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Admin Mark as Refunded modal states
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [refundReference, setRefundReference] = useState('');
  const [markingRefund, setMarkingRefund] = useState(false);

  // Quick View Drawer state
  const [drawer, setDrawer] = useState({ isOpen: false, type: null, entityId: null, title: '' });

  const openDrawer = (type, entityId, title) => {
    setDrawer({ isOpen: true, type, entityId, title });
  };

  const closeDrawer = () => {
    setDrawer({ isOpen: false, type: null, entityId: null, title: '' });
  };

  // Calculate active filter count
  const activeFilterCount = [
    currentStatus !== 'all',
    currentPaymentStatus !== 'all',
    currentDateRange !== 'all',
    currentAmountRange !== 'all',
    Boolean(currentSearch.trim()),
  ].filter(Boolean).length;

  const isFiltered = activeFilterCount > 0 || currentSort !== 'newest';

  // Fetch orders from backend with active query params
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (currentSearch.trim()) params.set('search', currentSearch.trim());
      if (currentStatus !== 'all') params.set('status', currentStatus);
      if (currentPaymentStatus !== 'all') params.set('paymentStatus', currentPaymentStatus);
      if (currentSort !== 'newest') params.set('sort', currentSort);
      if (currentDateRange !== 'all') params.set('dateRange', currentDateRange);
      if (currentDateRange === 'custom') {
        if (currentStartDate) params.set('startDate', currentStartDate);
        if (currentEndDate) params.set('endDate', currentEndDate);
      }
      if (currentAmountRange !== 'all') params.set('amountRange', currentAmountRange);

      const res = await axios.get(`/orders?${params.toString()}`);
      if (res.data.success) {
        setOrders(res.data.data);
        setPages(res.data.pages || 1);
        setTotalCount(res.data.total || 0);
        setTotalSystemOrders(res.data.totalSystemOrders || res.data.total || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  // Synchronize on searchParams change
  useEffect(() => {
    fetchOrders();
  }, [
    page,
    currentSearch,
    currentStatus,
    currentPaymentStatus,
    currentSort,
    currentDateRange,
    currentStartDate,
    currentEndDate,
    currentAmountRange,
  ]);

  // Keep local search input synced with URL search param
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  // Lock background scroll when mobile filter drawer is open
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

  // Helper to update URL params
  const updateQueryParam = (updates, resetPage = true) => {
    const nextParams = new URLSearchParams(searchParams);
    if (resetPage) {
      nextParams.set('page', '1');
    }
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === 'all' || (key === 'sort' && value === 'newest')) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });
    setSearchParams(nextParams);
  };

  // Search input handler with debounce
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      updateQueryParam({ search: val.trim() });
    }, 400);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    updateQueryParam({ search: '' });
  };

  const handleClearAllFilters = () => {
    setSearchInput('');
    setSearchParams({});
    setTempFilter({
      status: 'all',
      paymentStatus: 'all',
      dateRange: 'all',
      startDate: '',
      endDate: '',
      amountRange: 'all',
    });
    setIsMobileFilterOpen(false);
    setIsMobileSortOpen(false);
  };

  const handleOpenMobileFilter = () => {
    setTempFilter({
      status: currentStatus,
      paymentStatus: currentPaymentStatus,
      dateRange: currentDateRange,
      startDate: currentStartDate,
      endDate: currentEndDate,
      amountRange: currentAmountRange,
    });
    setIsMobileFilterOpen(true);
  };

  const handleApplyMobileFilter = () => {
    updateQueryParam({
      status: tempFilter.status,
      paymentStatus: tempFilter.paymentStatus,
      dateRange: tempFilter.dateRange,
      startDate: tempFilter.startDate,
      endDate: tempFilter.endDate,
      amountRange: tempFilter.amountRange,
    });
    setIsMobileFilterOpen(false);
  };

  const handleSelectSort = (sortVal) => {
    updateQueryParam({ sort: sortVal }, false);
    setIsMobileSortOpen(false);
  };

  const handleOpenStatusModal = (ord) => {
    setSelectedOrder(ord);
    const validOptions = ALLOWED_NEXT_STATUSES[ord.status] || [];
    setNewStatus(validOptions.length > 0 ? validOptions[0] : '');
    setTimelineNote('');
    setIsOpen(true);
  };

  const handleOpenCorrectionModal = (ord) => {
    setSelectedOrder(ord);
    const validCorrections = ALLOWED_CORRECTION_TARGETS[ord.status] || [];
    setCorrectionTarget(validCorrections.length > 0 ? validCorrections[0] : '');
    setCorrectionReason('');
    setIsCorrectionOpen(true);
  };

  const handleOpenCancelModal = (ord) => {
    setSelectedOrder(ord);
    setCancelReason('');
    setIsCancelOpen(true);
  };

  const handleOpenRefundModal = (ord) => {
    setSelectedOrder(ord);
    setRefundReference('');
    setIsRefundOpen(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!newStatus) {
      toast.error('Please select a valid next status.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.put(`/orders/${selectedOrder._id}/status`, {
        status: newStatus,
        note: timelineNote,
      });

      if (res.data.success) {
        toast.success(`Order status updated to ${newStatus.toUpperCase()} successfully.`);
        setIsOpen(false);
        fetchOrders();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating order status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!correctionReason || correctionReason.trim().length < 5) {
      toast.error('Please provide a reason (at least 5 characters) for this status correction.');
      return;
    }

    setCorrecting(true);
    try {
      const res = await axios.put(`/orders/${selectedOrder._id}/correct`, {
        targetStatus: correctionTarget,
        reason: correctionReason,
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Order status corrected successfully.');
        setIsCorrectionOpen(false);
        fetchOrders();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error executing status correction.');
    } finally {
      setCorrecting(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelReason || !cancelReason.trim()) {
      toast.error('Please enter a cancellation reason.');
      return;
    }

    setCancelling(true);
    try {
      const res = await axios.patch(`/orders/${selectedOrder._id}/cancel`, {
        reason: cancelReason.trim(),
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Order cancelled successfully.');
        setIsCancelOpen(false);
        fetchOrders();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error cancelling order.');
    } finally {
      setCancelling(false);
    }
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    setMarkingRefund(true);
    try {
      const res = await axios.patch(`/orders/${selectedOrder._id}/mark-refunded`, {
        transactionReference: refundReference.trim(),
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Order marked as refunded successfully.');
        setIsRefundOpen(false);
        fetchOrders();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error marking order as refunded.');
    } finally {
      setMarkingRefund(false);
    }
  };

  const currentSortLabel = SORT_OPTIONS.find((s) => s.value === currentSort)?.label || 'Newest First';
  const currentStatusLabel = ORDER_STATUS_OPTIONS.find((s) => s.value === currentStatus)?.label || 'All Orders';

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full font-sans text-[#111111] min-w-0">
      {/* ── Heading ── */}
      <div className="pb-4 border-b border-[#e5e5e5]">
        <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-[#111111]">
          Manage Orders
        </h1>
        <p className="text-xs text-[#6b7280] font-mono mt-1">
          Review checkout timeline, dispatch packages, and adjust status milestones.
        </p>
      </div>

      {/* ── 1. MOBILE CONTROLS & SEARCH (< md) ── */}
      <div className="md:hidden space-y-3 font-mono">
        {/* Search bar */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-3 text-[#9ca3af]" />
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search order ID, customer, email..."
            className="w-full bg-white border border-[#e5e5e5] rounded-xl pl-9 pr-8 py-2 text-xs text-[#111111] placeholder-[#9ca3af] focus:outline-none focus:border-[#111111]"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 top-2.5 text-[#9ca3af] hover:text-[#111111] cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

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
              activeFilterCount > 0
                ? 'bg-[#111111] text-white border-[#111111]'
                : 'bg-white text-[#111111] border-[#e5e5e5] hover:bg-[#f9fafb]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Filter size={12} className={activeFilterCount > 0 ? 'text-amber-400' : 'text-[#6b7280]'} />
              <span>FILTER</span>
            </span>
            {activeFilterCount > 0 ? (
              <span className="bg-amber-400 text-[#111111] text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                {activeFilterCount}
              </span>
            ) : (
              <span className="text-[10px] text-[#6b7280] uppercase truncate">
                {currentStatusLabel.replace(' Orders', '')}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Result Count & Clear shortcut */}
        <div className="flex items-center justify-between text-[11px] text-[#6b7280] px-1">
          <span>
            {loading ? (
              'Updating...'
            ) : activeFilterCount > 0 || currentSort !== 'newest' ? (
              <>Showing <strong>{totalCount}</strong> of {totalSystemOrders} orders</>
            ) : (
              <>{totalCount} orders</>
            )}
          </span>
          {isFiltered && (
            <button
              onClick={handleClearAllFilters}
              className="text-[#dc2626] hover:underline font-bold text-[10px] uppercase cursor-pointer flex items-center gap-1"
            >
              <RotateCcw size={10} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* ── 2. DESKTOP TOOLBAR (md and up) ── */}
      <div className="hidden md:flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 border border-[#e5e5e5] rounded-2xl shadow-xs font-mono text-xs">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={14} className="absolute left-3 top-2.5 text-[#9ca3af]" />
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search ID, customer, email, phone..."
            className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl pl-9 pr-8 py-1.5 text-xs text-[#111111] placeholder-[#9ca3af] focus:bg-white focus:outline-none focus:border-[#111111]"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 top-2 text-[#9ca3af] hover:text-[#111111] cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Right: Dropdowns toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <VaultSelect
            label="Status:"
            value={currentStatus}
            onChange={(val) => updateQueryParam({ status: val })}
            options={ORDER_STATUS_OPTIONS}
          />

          {/* Payment Status Filter */}
          <VaultSelect
            label="Payment:"
            value={currentPaymentStatus}
            onChange={(val) => updateQueryParam({ paymentStatus: val })}
            options={PAYMENT_STATUS_OPTIONS}
          />

          {/* Date Filter */}
          <VaultSelect
            label="Date:"
            value={currentDateRange}
            onChange={(val) => updateQueryParam({ dateRange: val })}
            options={DATE_RANGE_OPTIONS}
          />

          {/* Amount Filter */}
          <VaultSelect
            label="Amount:"
            value={currentAmountRange}
            onChange={(val) => updateQueryParam({ amountRange: val })}
            options={AMOUNT_RANGE_OPTIONS}
          />

          {/* Sort By Dropdown */}
          <VaultSelect
            label="Sort:"
            value={currentSort}
            onChange={(val) => updateQueryParam({ sort: val }, false)}
            options={SORT_OPTIONS}
          />

          {/* Clear Filters Button */}
          {isFiltered && (
            <button
              onClick={handleClearAllFilters}
              className="px-2.5 py-1.5 bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] rounded-xl text-xs font-bold hover:bg-[#fee2e2] transition-colors cursor-pointer flex items-center gap-1"
              title="Reset all filters"
            >
              <RotateCcw size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Desktop Result Summary Bar */}
      <div className="hidden md:flex items-center justify-between text-xs text-[#6b7280] font-mono px-1">
        <div>
          {loading ? (
            <span className="flex items-center gap-1.5">
              <RefreshCw size={12} className="animate-spin" /> Fetching orders...
            </span>
          ) : isFiltered ? (
            <span>
              Showing <strong>{totalCount}</strong> of <strong>{totalSystemOrders}</strong> total orders matching criteria
            </span>
          ) : (
            <span>
              <strong>{totalCount}</strong> registered orders
            </span>
          )}
        </div>

        {/* Active badges list */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-[#9ca3af]">Active Filters:</span>
            {currentStatus !== 'all' && (
              <span className="bg-[#f3f4f6] text-[#111111] px-2 py-0.5 rounded-full text-[10px] font-bold border border-[#e5e5e5] flex items-center gap-1">
                Status: {currentStatus.toUpperCase()}
                <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => updateQueryParam({ status: 'all' })} />
              </span>
            )}
            {currentPaymentStatus !== 'all' && (
              <span className="bg-[#f3f4f6] text-[#111111] px-2 py-0.5 rounded-full text-[10px] font-bold border border-[#e5e5e5] flex items-center gap-1">
                Payment: {currentPaymentStatus.toUpperCase()}
                <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => updateQueryParam({ paymentStatus: 'all' })} />
              </span>
            )}
            {currentDateRange !== 'all' && (
              <span className="bg-[#f3f4f6] text-[#111111] px-2 py-0.5 rounded-full text-[10px] font-bold border border-[#e5e5e5] flex items-center gap-1">
                Date: {currentDateRange.replace('_', ' ').toUpperCase()}
                <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => updateQueryParam({ dateRange: 'all', startDate: '', endDate: '' })} />
              </span>
            )}
            {currentAmountRange !== 'all' && (
              <span className="bg-[#f3f4f6] text-[#111111] px-2 py-0.5 rounded-full text-[10px] font-bold border border-[#e5e5e5] flex items-center gap-1">
                Amount: {currentAmountRange.replace('_', ' ').toUpperCase()}
                <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => updateQueryParam({ amountRange: 'all' })} />
              </span>
            )}
            {currentSearch.trim() && (
              <span className="bg-[#f3f4f6] text-[#111111] px-2 py-0.5 rounded-full text-[10px] font-bold border border-[#e5e5e5] flex items-center gap-1">
                "{currentSearch.trim()}"
                <X size={10} className="cursor-pointer hover:text-red-500" onClick={handleClearSearch} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── 3. ORDERS LIST / TABLE / EMPTY STATE ── */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#6b7280] flex flex-col items-center justify-center font-mono bg-white border border-[#e5e5e5] rounded-2xl">
          <div className="w-8 h-8 rounded-full border-2 border-[#111111] border-t-transparent animate-spin mb-2" />
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border border-[#e5e5e5] rounded-2xl font-mono space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#f9fafb] border border-[#e5e5e5] flex items-center justify-center mx-auto text-[#6b7280]">
            <Filter size={20} />
          </div>
          <h3 className="font-bold text-sm text-[#111111] uppercase tracking-wide">No orders found</h3>
          <p className="text-xs text-[#6b7280] max-w-sm mx-auto">
            {isFiltered
              ? 'No checkout orders match your selected filters or search criteria. Try adjusting or clearing your filters.'
              : 'No checkout orders registered yet.'}
          </p>
          {isFiltered && (
            <button
              onClick={handleClearAllFilters}
              className="mt-2 px-4 py-2 bg-[#111111] text-white hover:bg-black rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs inline-flex items-center gap-1.5"
            >
              <RotateCcw size={12} /> Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View (md and up) */}
          <div className="hidden md:block overflow-x-auto bg-white border border-[#e5e5e5] rounded-2xl shadow-xs font-mono w-full min-w-0">
            <table className="w-full text-left border-collapse text-xs table-auto">
              <thead>
                <tr className="border-b border-[#e5e5e5] text-[#6b7280] uppercase text-[10px] bg-[#f9fafb]">
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3 text-center">Items</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Payment ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {orders.map((ord) => {
                  const nextOptions = ALLOWED_NEXT_STATUSES[ord.status] || [];
                  const correctionOptions = ALLOWED_CORRECTION_TARGETS[ord.status] || [];
                  const isTerminal = nextOptions.length === 0;

                  return (
                    <tr key={ord._id} className="hover:bg-[#f9fafb] transition-colors group">
                      <td className="p-3 font-bold text-[#111111]">
                        <button 
                          onClick={() => openDrawer('ORDER', ord._id, `Order #${ord._id.toString().slice(-6).toUpperCase()}`)}
                          className="hover:text-[#d97706] hover:underline cursor-pointer transition-colors flex items-center gap-1 text-left"
                        >
                          #{ord._id.toString().slice(-6).toUpperCase()}
                        </button>
                      </td>
                      <td className="p-3 max-w-[160px] font-sans">
                        <div
                          onClick={() => openDrawer('ORDER', ord._id, `Order #${ord._id.toString().slice(-6).toUpperCase()}`)}
                          className="cursor-pointer hover:bg-[#f3f4f6] px-1.5 py-1 -ml-1.5 rounded transition-colors inline-block"
                        >
                          <p className="font-bold text-[#111111] text-xs truncate" title={ord.user?.name || ord.shippingAddress.name}>
                            {ord.user?.name || ord.shippingAddress.name}
                          </p>
                          <p className="text-[10px] text-[#6b7280] font-mono truncate" title={ord.user?.email || 'N/A'}>
                            {ord.user?.email || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="p-3 text-center text-[#374151]">
                        <span
                          onClick={() => openDrawer('ORDER', ord._id, `Order #${ord._id.toString().slice(-6).toUpperCase()}`)}
                          className="cursor-pointer hover:text-[#d97706] hover:underline decoration-dashed transition-colors"
                        >
                          {ord.items.reduce((sum, i) => sum + i.quantity, 0)} units
                        </span>
                      </td>
                      <td className="p-3 text-[#111111] font-bold">
                        <span
                          onClick={() => openDrawer('ORDER', ord._id, `Order #${ord._id.toString().slice(-6).toUpperCase()}`)}
                          className="cursor-pointer hover:text-[#d97706] hover:underline decoration-dashed transition-colors"
                        >
                          ₹{ord.grandTotal.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          onClick={() => openDrawer('ORDER', ord._id, `Order #${ord._id.toString().slice(-6).toUpperCase()}`)}
                          className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${
                            ord.paymentStatus === 'captured'
                              ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]'
                              : ord.paymentStatus === 'failed'
                              ? 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]'
                              : ord.paymentStatus === 'authorized'
                              ? 'bg-[#eff6ff] border-[#bfdbfe] text-[#2563eb]'
                              : ord.paymentStatus === 'refunded'
                              ? 'bg-[#faf5ff] border-[#e9d5ff] text-[#9333ea]'
                              : 'bg-[#fffbeb] border-[#fde68a] text-[#d97706]'
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3 max-w-[130px]">
                        {ord.razorpayPaymentId ? (
                          <span
                            onClick={() => openDrawer('ORDER', ord._id, `Order #${ord._id.toString().slice(-6).toUpperCase()}`)}
                            className="font-mono text-[10px] text-[#374151] truncate block max-w-[120px] cursor-pointer hover:text-[#d97706] hover:underline transition-colors"
                            title={ord.razorpayPaymentId}
                          >
                            {ord.razorpayPaymentId.slice(0, 10)}...
                          </span>
                        ) : (
                          <span className="text-[#9ca3af] italic">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          onClick={() => openDrawer('ORDER', ord._id, `Order #${ord._id.toString().slice(-6).toUpperCase()}`)}
                          className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${
                            ord.status === 'delivered'
                              ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]'
                              : ord.status === 'cancelled'
                              ? 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]'
                              : 'bg-[#fffbeb] border-[#fde68a] text-[#d97706]'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {/* 1. Normal Status Progression Button */}
                          {!isTerminal && (
                            <button
                              onClick={() => handleOpenStatusModal(ord)}
                              className="px-2.5 py-1 bg-white border border-[#e5e5e5] hover:bg-[#f9fafb] rounded-lg text-[#111111] cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold uppercase shadow-xs"
                              title="Update Status"
                            >
                              <Edit3 size={11} /> Update
                            </button>
                          )}

                          {/* 2. Admin Cancel Button */}
                          {ord.status !== 'delivered' && ord.status !== 'cancelled' && (
                            <button
                              onClick={() => handleOpenCancelModal(ord)}
                              className="px-2.5 py-1 bg-[#fef2f2] border border-[#fecaca] hover:bg-[#fee2e2] rounded-lg text-[#dc2626] cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold uppercase transition-all"
                              title="Cancel Order (Admin)"
                            >
                              <Ban size={11} /> Cancel
                            </button>
                          )}

                          {/* 3. Mark as Refunded Button */}
                          {ord.status === 'cancelled' &&
                            (['captured', 'SUCCESS', 'authorized'].includes(ord.paymentStatus) || (ord.walletAmountPaid || 0) > 0) &&
                            ord.refundStatus !== 'REFUNDED' && (
                              <button
                                onClick={() => handleOpenRefundModal(ord)}
                                className="px-2.5 py-1 bg-[#f0fdf4] border border-[#bbf7d0] hover:bg-[#dcfce7] rounded-lg text-[#16a34a] cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold uppercase transition-all"
                                title="Mark as Refunded"
                              >
                                <CheckCircle2 size={11} /> Mark Refunded
                              </button>
                            )}

                          {/* 4. Refunded Badge indicator */}
                          {ord.status === 'cancelled' && ord.refundStatus === 'REFUNDED' && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]">
                              REFUNDED
                            </span>
                          )}

                          {/* 5. Status Correction Button */}
                          {correctionOptions.length > 0 && (
                            <button
                              onClick={() => handleOpenCorrectionModal(ord)}
                              className="px-2.5 py-1 bg-[#fffbeb] border border-[#fde68a] hover:bg-[#fef3c7] rounded-lg text-[#d97706] cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold uppercase transition-all"
                              title="Correct Status (Audit Logged)"
                            >
                              <ShieldAlert size={11} /> Correct
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (< md) */}
          <div className="md:hidden space-y-4">
            {orders.map((ord) => {
              const nextOptions = ALLOWED_NEXT_STATUSES[ord.status] || [];
              const correctionOptions = ALLOWED_CORRECTION_TARGETS[ord.status] || [];
              const isTerminal = nextOptions.length === 0;

              return (
                <div
                  key={ord._id}
                  className="bg-white border border-[#e5e5e5] rounded-2xl p-4 shadow-xs space-y-3 font-mono text-xs"
                >
                  <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-2">
                    <button
                      onClick={() => openDrawer('ORDER', ord._id, `Order #${ord._id.toString().slice(-6).toUpperCase()}`)}
                      className="font-bold text-sm text-[#111111] hover:text-[#d97706] cursor-pointer"
                    >
                      #{ord._id.toString().slice(-6).toUpperCase()}
                    </button>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        ord.status === 'delivered'
                          ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]'
                          : ord.status === 'cancelled'
                          ? 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]'
                          : 'bg-[#fffbeb] border-[#fde68a] text-[#d97706]'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>

                  <div className="space-y-1 font-sans">
                    <p className="font-bold text-xs text-[#111111]">{ord.user?.name || ord.shippingAddress.name}</p>
                    <p className="text-[10px] text-[#6b7280] font-mono">{ord.user?.email || 'N/A'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#f3f4f6] text-[11px]">
                    <div>
                      <span className="text-[9px] text-[#6b7280] uppercase block font-bold">Total Units</span>
                      <span className="font-bold text-[#111111]">{ord.items.reduce((sum, i) => sum + i.quantity, 0)} items</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#6b7280] uppercase block font-bold">Grand Total</span>
                      <span className="font-bold text-[#111111]">₹{ord.grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#6b7280] uppercase block font-bold">Payment</span>
                      <span
                        className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block mt-0.5 ${
                          ord.paymentStatus === 'captured'
                            ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]'
                            : ord.paymentStatus === 'failed'
                            ? 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]'
                            : ord.paymentStatus === 'authorized'
                            ? 'bg-[#eff6ff] border-[#bfdbfe] text-[#2563eb]'
                            : ord.paymentStatus === 'refunded'
                            ? 'bg-[#faf5ff] border-[#e9d5ff] text-[#9333ea]'
                            : 'bg-[#fffbeb] border-[#fde68a] text-[#d97706]'
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </div>
                    {ord.razorpayPaymentId && (
                      <div>
                        <span className="text-[9px] text-[#6b7280] uppercase block font-bold">Pay ID</span>
                        <span className="font-mono text-[9px] text-[#6b7280] truncate block">{ord.razorpayPaymentId}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions row */}
                  <div className="pt-2 border-t border-[#e5e5e5] flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => openDrawer('ORDER', ord._id, `Order #${ord._id.toString().slice(-6).toUpperCase()}`)}
                      className="px-3 py-1.5 bg-[#f9fafb] hover:bg-[#f3f4f6] text-[#111111] border border-[#e5e5e5] rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1"
                    >
                      <Eye size={12} /> View Details
                    </button>

                    {!isTerminal && (
                      <button
                        onClick={() => handleOpenStatusModal(ord)}
                        className="px-3 py-1.5 bg-white border border-[#e5e5e5] hover:bg-[#f9fafb] rounded-xl text-[#111111] cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold uppercase shadow-xs"
                      >
                        <Edit3 size={11} /> Update
                      </button>
                    )}

                    {ord.status !== 'delivered' && ord.status !== 'cancelled' && (
                      <button
                        onClick={() => handleOpenCancelModal(ord)}
                        className="px-3 py-1.5 bg-[#fef2f2] border border-[#fecaca] hover:bg-[#fee2e2] rounded-xl text-[#dc2626] cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold uppercase transition-all"
                      >
                        <Ban size={11} /> Cancel
                      </button>
                    )}

                    {ord.status === 'cancelled' &&
                      (['captured', 'SUCCESS', 'authorized'].includes(ord.paymentStatus) || (ord.walletAmountPaid || 0) > 0) &&
                      ord.refundStatus !== 'REFUNDED' && (
                        <button
                          onClick={() => handleOpenRefundModal(ord)}
                          className="px-3 py-1.5 bg-[#f0fdf4] border border-[#bbf7d0] hover:bg-[#dcfce7] rounded-xl text-[#16a34a] cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold uppercase transition-all"
                        >
                          <CheckCircle2 size={11} /> Mark Refunded
                        </button>
                      )}

                    {correctionOptions.length > 0 && (
                      <button
                        onClick={() => handleOpenCorrectionModal(ord)}
                        className="px-3 py-1.5 bg-[#fffbeb] border border-[#fde68a] hover:bg-[#fef3c7] rounded-xl text-[#d97706] cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold uppercase transition-all"
                      >
                        <ShieldAlert size={11} /> Correct
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        pages={pages}
        onPageChange={(newPage) => updateQueryParam({ page: newPage }, false)}
        loading={loading}
      />

      {/* ── 4. MOBILE SORT BOTTOM SHEET / MODAL ── */}
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
                <h3 className="font-bold text-sm uppercase text-[#111111]">Sort Orders</h3>
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
                const isSelected = currentSort === opt.value;
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

      {/* ── 5. MOBILE FILTER BOTTOM SHEET / DRAWER ── */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs font-sans">
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative bg-white border border-[#e5e5e5] rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#e5e5e5]">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-[#6b7280]" />
                <h3 className="font-bold text-sm uppercase text-[#111111]">Filter Orders</h3>
              </div>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="text-[#6b7280] hover:text-[#111111] p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Filter Body */}
            <div className="p-5 space-y-5 overflow-y-auto font-mono text-xs flex-1">
              {/* Order Status Options */}
              <div>
                <label className="text-[10px] text-[#6b7280] uppercase font-bold block mb-2">
                  Order Status
                </label>
                <div className="grid grid-cols-2 gap-1.5 font-sans">
                  {ORDER_STATUS_OPTIONS.map((opt) => {
                    const isSelected = tempFilter.status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTempFilter({ ...tempFilter, status: opt.value })}
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

              {/* Payment Status Options */}
              <div>
                <label className="text-[10px] text-[#6b7280] uppercase font-bold block mb-2">
                  Payment Status
                </label>
                <div className="grid grid-cols-2 gap-1.5 font-sans">
                  {PAYMENT_STATUS_OPTIONS.map((opt) => {
                    const isSelected = tempFilter.paymentStatus === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTempFilter({ ...tempFilter, paymentStatus: opt.value })}
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

              {/* Date Filter Options */}
              <div>
                <label className="text-[10px] text-[#6b7280] uppercase font-bold block mb-2">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-1.5 font-sans">
                  {DATE_RANGE_OPTIONS.map((opt) => {
                    const isSelected = tempFilter.dateRange === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTempFilter({ ...tempFilter, dateRange: opt.value })}
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

                {tempFilter.dateRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-2 mt-2.5 p-2.5 bg-[#f9fafb] rounded-xl border border-[#e5e5e5]">
                    <div>
                      <span className="text-[9px] text-[#6b7280] block mb-1 font-bold">Start Date</span>
                      <input
                        type="date"
                        value={tempFilter.startDate}
                        onChange={(e) => setTempFilter({ ...tempFilter, startDate: e.target.value })}
                        className="w-full bg-white border border-[#e5e5e5] rounded-lg p-2 text-xs font-sans text-[#111111] focus:outline-none focus:border-[#111111]"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-[#6b7280] block mb-1 font-bold">End Date</span>
                      <input
                        type="date"
                        value={tempFilter.endDate}
                        onChange={(e) => setTempFilter({ ...tempFilter, endDate: e.target.value })}
                        className="w-full bg-white border border-[#e5e5e5] rounded-lg p-2 text-xs font-sans text-[#111111] focus:outline-none focus:border-[#111111]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Amount Range Options */}
              <div>
                <label className="text-[10px] text-[#6b7280] uppercase font-bold block mb-2">
                  Amount Range
                </label>
                <div className="grid grid-cols-2 gap-1.5 font-sans">
                  {AMOUNT_RANGE_OPTIONS.map((opt) => {
                    const isSelected = tempFilter.amountRange === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTempFilter({ ...tempFilter, amountRange: opt.value })}
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

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-[#e5e5e5] flex items-center justify-between gap-3 font-mono">
              <button
                type="button"
                onClick={() =>
                  setTempFilter({
                    status: 'all',
                    paymentStatus: 'all',
                    dateRange: 'all',
                    startDate: '',
                    endDate: '',
                    amountRange: 'all',
                  })
                }
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

      {/* Standard Status Editor Modal Overlay */}
      {isOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl font-mono text-[#111111]">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
              <h3 className="font-sans font-bold text-sm uppercase text-[#111111]">
                Update Order Status
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-[#6b7280] hover:text-[#111111] cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="bg-[#f9fafb] p-3 rounded-xl border border-[#e5e5e5] text-xs">
              <span className="text-[10px] text-[#6b7280] uppercase font-bold block mb-0.5">Current Status</span>
              <span className="font-mono font-extrabold text-[#111111] uppercase text-sm">{selectedOrder.status}</span>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-[#374151] uppercase font-bold block mb-1">
                  Allowed Next Status
                </label>
                {ALLOWED_NEXT_STATUSES[selectedOrder.status]?.length > 0 ? (
                  <select
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#111111] focus:outline-none focus:border-[#111111] cursor-pointer uppercase"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {ALLOWED_NEXT_STATUSES[selectedOrder.status].map((st) => (
                      <option key={st} value={st}>
                        {st.toUpperCase()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-[#d97706] bg-[#fffbeb] p-2.5 rounded-xl border border-[#fde68a] font-bold">
                    Order is in a terminal status ({selectedOrder.status.toUpperCase()}). Normal updates disabled.
                  </p>
                )}
              </div>

              <div>
                <label className="text-[10px] text-[#374151] uppercase font-bold block mb-1">Timeline Note</label>
                <input
                  type="text"
                  placeholder="e.g. Dispatched package via logistics..."
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-[#111111] placeholder-[#6b7280] focus:outline-none focus:border-[#111111]"
                  value={timelineNote}
                  onChange={(e) => setTimelineNote(e.target.value)}
                />
                <span className="text-[10px] text-[#6b7280] block mt-1">Visible to customer on tracking page.</span>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-[#e5e5e5]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs text-[#6b7280] hover:text-[#111111] font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || ALLOWED_NEXT_STATUSES[selectedOrder.status]?.length === 0}
                  className="bg-[#111111] hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-bold uppercase transition-all disabled:opacity-40 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Confirm Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATUS CORRECTION MODAL OVERLAY */}
      {isCorrectionOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl font-mono text-[#111111]">
            {/* Title Header */}
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
              <h3 className="font-sans font-bold text-sm uppercase text-[#111111] flex items-center gap-2">
                <ShieldAlert size={16} className="text-[#d97706]" /> Status Correction (Audit Logged)
              </h3>
              <button onClick={() => setIsCorrectionOpen(false)} className="text-[#6b7280] hover:text-[#111111] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Information Box */}
            <div className="bg-[#fffbeb] border border-[#fde68a] p-3.5 rounded-xl space-y-1">
              <p className="font-sans font-bold text-xs text-[#92400e]">Status Correction Feature</p>
              <p className="font-sans text-xs text-[#78350f] leading-relaxed">
                Use this option to fix accidental status updates (e.g. delivered by mistake). All corrections require an audit reason.
              </p>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="space-y-4 text-xs font-mono">
              {/* Current Status Label & Value */}
              <div className="space-y-1">
                <label className="text-[11px] text-[#374151] uppercase font-bold block">Current Status</label>
                <div className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-3 py-2 text-sm font-extrabold text-[#111111] uppercase">
                  {selectedOrder.status}
                </div>
              </div>

              {/* Correct Target Status */}
              <div className="space-y-1">
                <label className="text-[11px] text-[#374151] uppercase font-bold block">
                  Correct Target Status
                </label>
                <select
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-bold text-[#111111] uppercase focus:outline-none focus:border-[#111111] cursor-pointer"
                  value={correctionTarget}
                  onChange={(e) => setCorrectionTarget(e.target.value)}
                >
                  {ALLOWED_CORRECTION_TARGETS[selectedOrder.status]?.map((st) => (
                    <option key={st} value={st}>
                      {st.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Correction Reason */}
              <div className="space-y-1">
                <label className="text-[11px] text-[#374151] uppercase font-bold block">
                  Correction Reason (Required)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Order was accidentally marked as delivered."
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-sans text-[#111111] placeholder-[#4b5563] focus:outline-none focus:border-[#111111] leading-relaxed"
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#e5e5e5]">
                <button
                  type="button"
                  onClick={() => setIsCorrectionOpen(false)}
                  className="px-4 py-2 text-xs text-[#6b7280] hover:text-[#111111] font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={correcting}
                  className="bg-[#d97706] hover:bg-[#b45309] text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-40"
                >
                  {correcting ? 'Saving Correction...' : 'Confirm Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN CANCEL ORDER CONFIRMATION MODAL OVERLAY */}
      {isCancelOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl font-mono text-[#111111]">
            {/* Title Header */}
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
              <h3 className="font-sans font-bold text-sm uppercase text-[#dc2626] flex items-center gap-2">
                <Ban size={16} /> Cancel Order
              </h3>
              <button onClick={() => setIsCancelOpen(false)} className="text-[#6b7280] hover:text-[#111111] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Order Summary Box */}
            <div className="bg-[#fef2f2] border border-[#fecaca] p-3.5 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] text-[#991b1b] uppercase font-bold">Order ID</span>
                <span className="font-bold text-[#111111]">#{selectedOrder._id.toString().slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] text-[#991b1b] uppercase font-bold">Current Status</span>
                <span className="font-extrabold text-[#dc2626] uppercase">{selectedOrder.status}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] text-[#991b1b] uppercase font-bold">Amount Paid</span>
                <span className="font-bold text-[#111111]">₹{selectedOrder.grandTotal?.toLocaleString('en-IN')}</span>
              </div>
              <p className="font-sans text-xs text-[#991b1b] pt-1 border-t border-[#fecaca]/60 leading-relaxed font-bold">
                Are you sure you want to cancel this order?
              </p>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-4 text-xs font-mono">
              {/* Cancellation Reason (Required) */}
              <div className="space-y-1">
                <label className="text-[11px] text-[#374151] uppercase font-bold block">
                  Cancellation Reason (Required)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Package damaged during transit, product unavailable, logistics issue..."
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-sans text-[#111111] placeholder-[#9ca3af] focus:outline-none focus:border-[#dc2626] leading-relaxed"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                />
                <span className="text-[10px] text-[#6b7280] block font-sans">
                  The cancellation reason will be recorded and shared with the customer.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#e5e5e5]">
                <button
                  type="button"
                  onClick={() => setIsCancelOpen(false)}
                  className="px-4 py-2 text-xs text-[#6b7280] hover:text-[#111111] font-bold uppercase cursor-pointer"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={cancelling || !cancelReason.trim()}
                  className="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-40"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN MARK AS REFUNDED MODAL OVERLAY */}
      {isRefundOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl font-mono text-[#111111]">
            {/* Title Header */}
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
              <h3 className="font-sans font-bold text-sm uppercase text-[#16a34a] flex items-center gap-2">
                <CheckCircle2 size={16} /> Mark Order as Refunded
              </h3>
              <button onClick={() => setIsRefundOpen(false)} className="text-[#6b7280] hover:text-[#111111] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Information Box */}
            <div className="bg-[#f0fdf4] border border-[#bbf7d0] p-3.5 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] text-[#166534] uppercase font-bold">Order ID</span>
                <span className="font-bold text-[#111111]">#{selectedOrder._id.toString().slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] text-[#166534] uppercase font-bold">Customer</span>
                <span className="font-bold text-[#111111]">{selectedOrder.user?.name || selectedOrder.shippingAddress?.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] text-[#166534] uppercase font-bold">Amount to Refund</span>
                <span className="font-extrabold text-[#16a34a] text-sm">₹{selectedOrder.grandTotal?.toLocaleString('en-IN')}</span>
              </div>
              {selectedOrder.razorpayPaymentId && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] text-[#166534] uppercase font-bold">Payment ID</span>
                  <span className="font-mono text-[10px] text-[#374151]">{selectedOrder.razorpayPaymentId}</span>
                </div>
              )}
              <p className="font-sans text-xs text-[#166534] pt-2 border-t border-[#bbf7d0]/60 leading-relaxed">
                Confirm that you have manually transferred <strong>₹{selectedOrder.grandTotal?.toLocaleString('en-IN')}</strong> to the customer's payment/UPI account.
              </p>
            </div>

            <form onSubmit={handleRefundSubmit} className="space-y-4 text-xs font-mono">
              {/* Payment Reference / UTR (Optional) */}
              <div className="space-y-1">
                <label className="text-[11px] text-[#374151] uppercase font-bold block">
                  Payment Reference / UTR / Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 123456789012 (GPay/UPI Ref ID)"
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-sans text-[#111111] placeholder-[#9ca3af] focus:outline-none focus:border-[#16a34a]"
                  value={refundReference}
                  onChange={(e) => setRefundReference(e.target.value)}
                />
                <span className="text-[10px] text-[#6b7280] block font-sans">
                  Helps track and audit manual external transfers.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#e5e5e5]">
                <button
                  type="button"
                  onClick={() => setIsRefundOpen(false)}
                  className="px-4 py-2 text-xs text-[#6b7280] hover:text-[#111111] font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={markingRefund}
                  className="bg-[#16a34a] hover:bg-[#15803d] text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-40"
                >
                  {markingRefund ? 'Confirming...' : 'Confirm Refunded'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REUSABLE DETAILS DRAWER */}
      <AdminDetailsDrawer
        isOpen={drawer.isOpen}
        onClose={closeDrawer}
        title={drawer.title}
        subtitle="Quick View"
      >
        {drawer.type === 'ORDER' && <OrderDetailsView orderId={drawer.entityId} />}
      </AdminDetailsDrawer>
    </div>
  );
}
