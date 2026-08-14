import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Star,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Check,
  X,
  EyeOff,
  Trash2,
  Filter,
  Search,
  Flag,
  ThumbsUp,
  Image as ImageIcon,
  Home,
  Sparkles,
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import { PremiumSwal } from '../../utils/swalHelper';
import { resolveImage } from '../../utils/imageHelper';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  // Filter States
  const [statusFilter, setStatusFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [reportedOnly, setReportedOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Details Modal
  const [selectedReview, setSelectedReview] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const fetchReviews = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
      };
      if (statusFilter) params.status = statusFilter;
      if (ratingFilter) params.rating = ratingFilter;
      if (reportedOnly) params.reportedOnly = 'true';
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await axios.get('/reviews/admin/all', { params });
      if (res.data.success) {
        setReviews(res.data.data.reviews);
        setPagination(res.data.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching admin reviews:', err);
      toast.error('Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(1);
  }, [statusFilter, ratingFilter, reportedOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReviews(1);
  };

  // Status Change Action (approve, reject, hide)
  const handleStatusChange = async (reviewId, newStatus) => {
    try {
      const res = await axios.patch(`/reviews/admin/${reviewId}/status`, {
        status: newStatus,
      });
      if (res.data.success) {
        toast.success(res.data.message || `Review marked as ${newStatus}`);
        if (selectedReview && selectedReview._id === reviewId) {
          setSelectedReview({ ...selectedReview, status: newStatus });
        }
        fetchReviews(pagination.page);
      }
    } catch (err) {
      toast.error('Failed to update review status.');
    }
  };

  // Toggle Homepage Visibility
  const handleToggleHomepage = async (reviewId, currentVal) => {
    try {
      const res = await axios.patch(`/reviews/admin/${reviewId}/homepage`, {
        showOnHomepage: !currentVal,
      });
      if (res.data.success) {
        toast.success(!currentVal ? 'Review featured on Homepage' : 'Review removed from Homepage');
        if (selectedReview && selectedReview._id === reviewId) {
          setSelectedReview({ ...selectedReview, showOnHomepage: !currentVal });
        }
        fetchReviews(pagination.page);
      }
    } catch (err) {
      toast.error('Failed to update homepage status.');
    }
  };

  // Delete Review
  const handleDeleteReview = async (reviewId) => {
    const result = await PremiumSwal.fire({
      title: 'Delete Review?',
      text: 'Are you sure you want to permanently delete this customer review?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        const res = await axios.delete(`/reviews/admin/${reviewId}`);
        if (res.data.success) {
          toast.success('Review deleted permanently.');
          setDetailsModalOpen(false);
          fetchReviews(pagination.page);
        }
      } catch (err) {
        toast.error('Failed to delete review.');
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]';
      case 'pending':
        return 'bg-[#fffbeb] text-[#d97706] border-[#fde68a]';
      case 'rejected':
        return 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]';
      case 'hidden':
        return 'bg-[#f3f4f6] text-[#4b5563] border-[#e5e7eb]';
      default:
        return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full font-sans text-[#111111] min-w-0">
      {/* Title */}
      <div className="pb-4 border-b border-[#e5e5e5]">
        <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-[#111111] flex items-center gap-2">
          <Star className="text-[#d97706] fill-[#d97706]" size={24} /> Customer Reviews Moderation
        </h1>
        <p className="text-xs text-[#6b7280] font-mono mt-1">
          Review, approve, reject, hide, or moderate customer ratings and product feedback.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-4 shadow-xs space-y-3 font-mono text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-[#6b7280] uppercase font-bold flex items-center gap-1">
              <Filter size={12} /> Status:
            </span>
            {['', 'approved', 'pending', 'hidden', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer border ${
                  statusFilter === st
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#6b7280] border-[#e5e5e5] hover:border-[#111111]'
                }`}
              >
                {st === '' ? 'ALL' : st}
              </button>
            ))}

            <button
              onClick={() => setReportedOnly(!reportedOnly)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer border flex items-center gap-1 ${
                reportedOnly
                  ? 'bg-[#dc2626] text-white border-[#dc2626]'
                  : 'bg-white text-[#6b7280] border-[#e5e5e5] hover:border-[#dc2626]'
              }`}
            >
              <Flag size={10} /> Reported Only
            </button>
          </div>

          {/* Rating filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#6b7280] uppercase font-bold">Rating:</span>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-2.5 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
            >
              <option value="">All Stars</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 pt-1 border-t border-[#e5e5e5]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-[#9ca3af]" size={14} />
            <input
              type="text"
              placeholder="Search by review headline or review comment text..."
              className="w-full bg-[#f9fafb] border border-[#e5e5e5] rounded-xl pl-9 pr-3 py-2 text-xs font-sans text-[#111111] focus:bg-white focus:outline-none focus:border-[#111111]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="bg-[#111111] hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          >
            Search
          </button>
        </form>
      </div>

      {/* Reviews Table */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#6b7280] font-mono flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#111111] border-t-transparent animate-spin mb-2" />
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#e5e5e5] rounded-2xl font-mono text-xs text-[#6b7280]">
          <Star size={28} className="mx-auto text-[#9ca3af] mb-2" />
          No customer reviews match the selected filters.
        </div>
      ) : (
        <div className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden shadow-xs">
          {/* Desktop Table View (md+) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-[#e5e5e5] text-[#6b7280] uppercase text-[10px] bg-[#f9fafb]">
                  <th className="p-3.5">Customer & Product</th>
                  <th className="p-3.5">Rating & Review</th>
                  <th className="p-3.5">Photos</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Homepage</th>
                  <th className="p-3.5">Reports / Helpful</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {reviews.map((rev) => (
                  <tr key={rev._id} className="hover:bg-[#f9fafb] transition-colors">
                    {/* Customer & Product */}
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#111111] font-sans">{rev.user?.name || 'Customer'}</span>
                          {rev.isVerifiedPurchase && (
                            <CheckCircle2 size={12} className="text-[#16a34a]" title="Verified Purchase" />
                          )}
                        </div>
                        <p className="text-[10px] text-[#6b7280] font-sans truncate max-w-[180px]">
                          {rev.product?.name || 'Unknown Product'}
                        </p>
                      </div>
                    </td>

                    {/* Rating & Review */}
                    <td className="p-3.5 max-w-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <div className="flex text-[#f5a623]">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} size={11} className="fill-[#f5a623]" />
                            ))}
                          </div>
                          {rev.title && (
                            <span className="font-bold text-[#111111] font-sans text-xs truncate">
                              {rev.title}
                            </span>
                          )}
                        </div>
                        <p className="text-[#4b5563] text-xs font-sans line-clamp-2 leading-relaxed">
                          {rev.comment}
                        </p>
                      </div>
                    </td>

                    {/* Photos */}
                    <td className="p-3.5">
                      {rev.images && rev.images.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <ImageIcon size={14} className="text-[#d97706]" />
                          <span className="font-bold text-[#111111]">{rev.images.length}</span>
                        </div>
                      ) : (
                        <span className="text-[#9ca3af]">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadgeClass(
                          rev.status
                        )}`}
                      >
                        {rev.status}
                      </span>
                    </td>

                    {/* Homepage Toggle */}
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleHomepage(rev._id, rev.showOnHomepage)}
                        disabled={rev.status !== 'approved'}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer border disabled:opacity-40 disabled:cursor-not-allowed ${
                          rev.showOnHomepage
                            ? 'bg-[#f59e0b]/10 text-[#d97706] border-[#f59e0b]/40 shadow-xs'
                            : 'bg-white text-[#9ca3af] border-[#e5e5e5] hover:text-[#111111]'
                        }`}
                        title={rev.status !== 'approved' ? 'Only approved reviews can be shown on homepage' : 'Toggle Homepage display'}
                      >
                        <Sparkles size={10} className={rev.showOnHomepage ? 'text-[#d97706] fill-[#d97706]' : ''} />
                        {rev.showOnHomepage ? 'FEATURED' : 'OFF'}
                      </button>
                    </td>

                    {/* Reports / Helpful */}
                    <td className="p-3.5 text-[11px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[#4b5563]">
                          <ThumbsUp size={11} /> {rev.helpfulCount || 0}
                        </div>
                        {rev.reportCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#dc2626] bg-[#fef2f2] px-1.5 py-0.5 rounded border border-[#fecaca]">
                            <Flag size={9} /> {rev.reportCount} report{rev.reportCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="p-3.5 text-[10px] text-[#6b7280]">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedReview(rev);
                            setDetailsModalOpen(true);
                          }}
                          className="p-1.5 text-[#4b5563] hover:text-[#111111] hover:bg-[#e5e5e5] rounded-lg cursor-pointer transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>

                        {rev.status !== 'approved' && (
                          <button
                            onClick={() => handleStatusChange(rev._id, 'approved')}
                            className="p-1.5 text-[#16a34a] hover:bg-[#dcfce7] rounded-lg cursor-pointer transition-colors"
                            title="Approve Review"
                          >
                            <Check size={14} />
                          </button>
                        )}

                        {rev.status !== 'rejected' && (
                          <button
                            onClick={() => handleStatusChange(rev._id, 'rejected')}
                            className="p-1.5 text-[#d97706] hover:bg-[#fef3c7] rounded-lg cursor-pointer transition-colors"
                            title="Reject Review"
                          >
                            <X size={14} />
                          </button>
                        )}

                        {rev.status !== 'hidden' && (
                          <button
                            onClick={() => handleStatusChange(rev._id, 'hidden')}
                            className="p-1.5 text-[#6b7280] hover:bg-[#e5e7eb] rounded-lg cursor-pointer transition-colors"
                            title="Hide Review"
                          >
                            <EyeOff size={14} />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteReview(rev._id)}
                          className="p-1.5 text-[#dc2626] hover:bg-[#fee2e2] rounded-lg cursor-pointer transition-colors"
                          title="Delete Review"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards (< md) */}
          <div className="md:hidden divide-y divide-[#e5e5e5] p-3 space-y-3">
            {reviews.map((rev) => (
              <div key={rev._id} className="pt-3 first:pt-0 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[#f5a623]">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} size={12} className="fill-[#f5a623]" />
                    ))}
                  </div>
                  <span
                    className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadgeClass(
                      rev.status
                    )}`}
                  >
                    {rev.status}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-[#111111]">{rev.user?.name || 'Customer'}</span>
                    {rev.isVerifiedPurchase && (
                      <CheckCircle2 size={11} className="text-[#16a34a]" />
                    )}
                  </div>
                  <p className="text-[10px] text-[#6b7280] truncate">{rev.product?.name || 'Product'}</p>
                </div>

                {rev.title && (
                  <h4 className="font-bold text-xs text-[#111111]">{rev.title}</h4>
                )}

                <p className="text-xs text-[#4b5563] leading-relaxed line-clamp-3 font-sans">
                  {rev.comment}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-[#6b7280] pt-1">
                  <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    {rev.images && rev.images.length > 0 && (
                      <span className="flex items-center gap-0.5 text-[#d97706]">
                        <ImageIcon size={11} /> {rev.images.length} photos
                      </span>
                    )}
                    <span>👍 {rev.helpfulCount || 0}</span>
                  </div>
                </div>

                {/* Mobile Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-1.5 border-t border-[#f3f4f6]">
                  <button
                    onClick={() => handleToggleHomepage(rev._id, rev.showOnHomepage)}
                    disabled={rev.status !== 'approved'}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase border ${
                      rev.showOnHomepage
                        ? 'bg-[#f59e0b]/10 text-[#d97706] border-[#f59e0b]/40'
                        : 'bg-[#f9fafb] text-[#6b7280] border-[#e5e5e5]'
                    }`}
                  >
                    Homepage: {rev.showOnHomepage ? 'ON' : 'OFF'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedReview(rev);
                        setDetailsModalOpen(true);
                      }}
                      className="p-1.5 bg-[#f9fafb] text-[#111111] border border-[#e5e5e5] rounded-lg"
                      title="View Details"
                    >
                      <Eye size={13} />
                    </button>
                    {rev.status !== 'approved' && (
                      <button
                        onClick={() => handleStatusChange(rev._id, 'approved')}
                        className="p-1.5 bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] rounded-lg"
                        title="Approve"
                      >
                        <Check size={13} />
                      </button>
                    )}
                    {rev.status !== 'rejected' && (
                      <button
                        onClick={() => handleStatusChange(rev._id, 'rejected')}
                        className="p-1.5 bg-[#fffbeb] text-[#d97706] border border-[#fde68a] rounded-lg"
                        title="Reject"
                      >
                        <X size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteReview(rev._id)}
                      className="p-1.5 bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] rounded-lg"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="p-4 border-t border-[#e5e5e5] flex justify-center">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={(p) => fetchReviews(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* ── REVIEW DETAILS MODAL ── */}
      {detailsModalOpen && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 max-w-xl w-full shadow-2xl text-[#111111] my-8 font-sans space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
              <h3 className="font-bold text-sm uppercase text-[#111111] flex items-center gap-2">
                <Star className="text-[#d97706] fill-[#d97706]" size={16} /> Review Details & Moderation
              </h3>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="text-[#6b7280] hover:text-[#111111] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* Product & User Details */}
              <div className="grid grid-cols-2 gap-4 bg-[#f9fafb] p-4 rounded-xl border border-[#e5e5e5]">
                <div>
                  <span className="text-[10px] text-[#6b7280] uppercase block">Customer</span>
                  <p className="font-bold text-[#111111] font-sans mt-0.5">{selectedReview.user?.name || 'Customer'}</p>
                  <p className="text-[10px] text-[#6b7280]">{selectedReview.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#6b7280] uppercase block">Product</span>
                  <p className="font-bold text-[#111111] font-sans mt-0.5">{selectedReview.product?.name || 'Unknown'}</p>
                  <span className="text-[10px] text-[#16a34a] font-bold">
                    {selectedReview.isVerifiedPurchase ? '✓ Verified Purchase' : 'Unverified'}
                  </span>
                </div>
              </div>

              {/* Rating & Content */}
              <div className="space-y-2 p-4 bg-[#f9fafb] rounded-xl border border-[#e5e5e5]">
                <div className="flex items-center gap-2">
                  <div className="flex text-[#f5a623]">
                    {[...Array(selectedReview.rating)].map((_, i) => (
                      <Star key={i} size={14} className="fill-[#f5a623]" />
                    ))}
                  </div>
                  {selectedReview.title && (
                    <span className="font-bold text-xs text-[#111111] font-sans uppercase">
                      {selectedReview.title}
                    </span>
                  )}
                </div>

                <p className="text-xs font-sans text-[#374151] leading-relaxed whitespace-pre-line pt-1">
                  {selectedReview.comment}
                </p>
              </div>

              {/* Uploaded Photos */}
              {selectedReview.images && selectedReview.images.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] text-[#6b7280] uppercase font-bold block">Uploaded Photos</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedReview.images.map((img, i) => (
                      <a
                        key={i}
                        href={resolveImage(img)}
                        target="_blank"
                        rel="noreferrer"
                        className="w-20 h-20 rounded-xl overflow-hidden border border-[#e5e5e5] hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={resolveImage(img)}
                          alt="Review"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* User Reports if any */}
              {selectedReview.reports && selectedReview.reports.length > 0 && (
                <div className="space-y-1.5 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-xl">
                  <span className="text-[10px] text-[#dc2626] uppercase font-bold flex items-center gap-1">
                    <Flag size={12} /> Reports submitted ({selectedReview.reports.length})
                  </span>
                  <div className="space-y-1 text-[11px] text-[#991b1b]">
                    {selectedReview.reports.map((rep, idx) => (
                      <div key={idx} className="flex justify-between border-t border-[#fecaca] pt-1 mt-1">
                        <span>Reason: "{rep.reason}"</span>
                        <span className="text-[10px] text-[#b91c1c]">{new Date(rep.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Homepage Feature Control in Details */}
              <div className="p-3 bg-[#f9fafb] rounded-xl border border-[#e5e5e5] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#6b7280] uppercase font-bold block flex items-center gap-1">
                    <Sparkles size={12} className="text-[#d97706]" /> Feature on Homepage
                  </span>
                  <p className="text-[10px] text-[#4b5563] font-sans">
                    {selectedReview.showOnHomepage
                      ? 'This review is currently showcased on the homepage carousel.'
                      : 'Showcase this approved review on the homepage carousel.'}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleHomepage(selectedReview._id, selectedReview.showOnHomepage)}
                  disabled={selectedReview.status !== 'approved'}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer border disabled:opacity-40 disabled:cursor-not-allowed ${
                    selectedReview.showOnHomepage
                      ? 'bg-[#f59e0b] text-white border-[#d97706]'
                      : 'bg-white text-[#111111] border-[#e5e5e5] hover:bg-[#f3f4f6]'
                  }`}
                >
                  <Sparkles size={11} className={selectedReview.showOnHomepage ? 'fill-white text-white' : ''} />
                  {selectedReview.showOnHomepage ? 'FEATURED (ON)' : 'SHOW ON HOMEPAGE'}
                </button>
              </div>

              {/* Moderation Actions */}
              <div className="pt-3 border-t border-[#e5e5e5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedReview._id, 'approved')}
                    className="px-3 py-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedReview._id, 'rejected')}
                    className="px-3 py-1.5 bg-[#d97706] hover:bg-[#b45309] text-white rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedReview._id, 'hidden')}
                    className="px-3 py-1.5 bg-[#4b5563] hover:bg-[#374151] text-white rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
                  >
                    Hide
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteReview(selectedReview._id)}
                  className="px-3 py-1.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
