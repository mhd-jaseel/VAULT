import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  Flag,
  Edit2,
  Trash2,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ShoppingBag,
  Plus,
  Image as ImageIcon,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import WriteReviewModal from './WriteReviewModal';
import { PremiumSwal } from '../../utils/swalHelper';
import { resolveImage } from '../../utils/imageHelper';

export default function ReviewSection({ productId, productName }) {
  const { user } = useContext(AuthContext);

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    distributionPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
    hasMore: false,
  });

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeRatingFilter, setActiveRatingFilter] = useState(null); // null for All
  const [sortBy, setSortBy] = useState('relevant'); // relevant, newest, highest, lowest, helpful

  // Eligibility state
  const [eligibility, setEligibility] = useState({
    isEligible: false,
    hasReviewed: false,
    existingReview: null,
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Fetch Reviews
  const fetchReviews = async (page = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = {
        page,
        limit: 10,
        sortBy,
      };
      if (activeRatingFilter) params.rating = activeRatingFilter;

      const res = await axios.get(`/reviews/product/${productId}`, { params });
      if (res.data.success) {
        const { reviews: fetchedReviews, stats: fetchedStats, pagination: fetchedPagination } = res.data.data;
        if (append) {
          setReviews((prev) => [...prev, ...fetchedReviews]);
        } else {
          setReviews(fetchedReviews);
        }
        setStats(fetchedStats);
        setPagination(fetchedPagination);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Check Eligibility
  const checkPurchaseEligibility = async () => {
    if (!user) {
      setEligibility({ isEligible: false, hasReviewed: false, existingReview: null });
      return;
    }

    try {
      const res = await axios.get(`/reviews/eligibility/${productId}`);
      if (res.data.success) {
        setEligibility(res.data.data);
      }
    } catch (err) {
      console.error('Error checking review eligibility:', err);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews(1, false);
      checkPurchaseEligibility();
    }
  }, [productId, activeRatingFilter, sortBy, user]);

  const handleLoadMore = () => {
    if (pagination.hasMore && !loadingMore) {
      fetchReviews(pagination.page + 1, true);
    }
  };

  const handleReviewSubmitted = () => {
    fetchReviews(1, false);
    checkPurchaseEligibility();
  };

  // Toggle Helpful Vote
  const handleToggleHelpful = async (reviewId) => {
    if (!user) {
      toast.warning('Please log in to vote on reviews.');
      return;
    }

    try {
      const res = await axios.post(`/reviews/${reviewId}/helpful`);
      if (res.data.success) {
        const { helpfulCount, isHelpful } = res.data.data;
        setReviews((prev) =>
          prev.map((r) => (r._id === reviewId ? { ...r, helpfulCount, isHelpful } : r))
        );
      }
    } catch (err) {
      toast.error('Failed to register vote.');
    }
  };

  // Report Review State
  const [reportModal, setReportModal] = useState({ isOpen: false, reviewId: null });
  const [selectedReportReason, setSelectedReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const REPORT_REASONS = [
    { id: 'Inappropriate content', label: 'Inappropriate content', desc: 'Contains offensive, explicit, or unlawful material' },
    { id: 'Spam or fake review', label: 'Spam or advertising', desc: 'Promotional content, repeated text, or fake rating' },
    { id: 'Offensive language', label: 'Offensive language / Hate speech', desc: 'Harassment, profanity, or discriminatory remarks' },
    { id: 'Irrelevant to product', label: 'Irrelevant to product', desc: 'Does not describe the accessory, quality, or fit' },
  ];

  const handleOpenReportModal = (reviewId) => {
    if (!user) {
      toast.warning('Please log in to report reviews.');
      return;
    }
    setSelectedReportReason(REPORT_REASONS[0].id);
    setReportModal({ isOpen: true, reviewId });
  };

  const handleConfirmReport = async () => {
    if (!selectedReportReason) {
      toast.warning('Please select a reason for reporting.');
      return;
    }

    setIsSubmittingReport(true);
    try {
      const res = await axios.post(`/reviews/${reportModal.reviewId}/report`, { reason: selectedReportReason });
      if (res.data.success) {
        toast.success(res.data.message || 'Report submitted for review.');
        setReviews((prev) =>
          prev.map((r) => (r._id === reportModal.reviewId ? { ...r, isReported: true } : r))
        );
        setReportModal({ isOpen: false, reviewId: null });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Delete Own Review
  const handleDeleteReview = async (reviewId) => {
    const result = await PremiumSwal.fire({
      title: 'Delete Your Review?',
      text: 'Are you sure you want to remove your review and rating?',
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
          fetchReviews(1, false);
          checkPurchaseEligibility();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete review.');
      }
    }
  };

  return (
    <section className="glass-card mt-8 text-[#111111] font-sans">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-light pb-4 mb-6 gap-3">
        <div>
          <h2 className="text-md md:text-lg font-extrabold uppercase tracking-tight text-text-primary">
            Customer Reviews & Ratings
          </h2>
          <p className="text-xs text-text-secondary font-mono mt-0.5">
            Verified feedback from genuine Vault customers.
          </p>
        </div>

        {/* Action Button */}
        {user ? (
          eligibility.isEligible ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-gold text-[10px] !py-2.5 !px-5 uppercase tracking-widest font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              {eligibility.hasReviewed ? (
                <>
                  <Edit2 size={13} /> EDIT YOUR REVIEW
                </>
              ) : (
                <>
                  <Plus size={13} /> WRITE A REVIEW
                </>
              )}
            </button>
          ) : (
            <div className="text-[10px] text-text-secondary font-mono bg-neutral-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              ✓ Verified buyers with delivered orders can review
            </div>
          )
        ) : (
          <a
            href="/login"
            className="btn-dark text-[10px] !py-2 !px-4 uppercase tracking-wider font-bold self-start sm:self-auto"
          >
            LOGIN TO REVIEW
          </a>
        )}
      </div>

      {/* ── RATING OVERVIEW BREAKDOWN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-b border-border-light pb-8 mb-8">
        {/* Left: Overall Rating Score */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-neutral-50 rounded-2xl border border-border-light text-center">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold font-mono text-text-primary">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
            </span>
            <span className="text-sm font-mono text-text-secondary">/ 5.0</span>
          </div>

          {/* Star Display */}
          <div className="flex text-[#f5a623] my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={
                  star <= Math.round(stats.averageRating)
                    ? 'text-[#f5a623] fill-[#f5a623]'
                    : 'text-neutral-300'
                }
              />
            ))}
          </div>

          <p className="text-xs font-mono text-text-secondary">
            {stats.totalReviews === 0
              ? 'No ratings yet'
              : `Based on ${stats.totalReviews} verified review${stats.totalReviews > 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Right: Star Rating Distribution Progress Bars */}
        <div className="lg:col-span-8 flex flex-col justify-center space-y-2.5">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = stats.distribution[stars] || 0;
            const pct = stats.distributionPercentages[stars] || 0;
            const isFilterActive = activeRatingFilter === stars;

            return (
              <button
                key={stars}
                onClick={() => setActiveRatingFilter(isFilterActive ? null : stars)}
                className={`w-full flex items-center gap-3 text-xs font-mono group p-1 rounded-lg transition-colors cursor-pointer text-left ${
                  isFilterActive ? 'bg-neutral-100 font-bold' : 'hover:bg-neutral-50'
                }`}
              >
                <span className="w-8 text-right text-text-primary font-bold">{stars} ★</span>

                {/* Progress bar container */}
                <div className="flex-1 h-2.5 bg-neutral-200 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isFilterActive ? 'bg-black' : 'bg-[#d97706] group-hover:bg-black'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="w-16 flex justify-between text-[11px] text-text-secondary">
                  <span>{pct}%</span>
                  <span className="text-[10px]">({count})</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── FILTER & SORT CONTROLS BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 font-mono text-xs">
        {/* Rating Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[10px] uppercase text-text-secondary font-bold mr-1 shrink-0 flex items-center gap-1">
            <Filter size={12} /> Filter:
          </span>
          <button
            onClick={() => setActiveRatingFilter(null)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all shrink-0 cursor-pointer border ${
              activeRatingFilter === null
                ? 'bg-black text-white border-black'
                : 'bg-white text-text-secondary border-border-light hover:border-text-primary'
            }`}
          >
            All ({stats.totalReviews})
          </button>
          {[5, 4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              onClick={() => setActiveRatingFilter(activeRatingFilter === stars ? null : stars)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all shrink-0 cursor-pointer border ${
                activeRatingFilter === stars
                  ? 'bg-[#d97706] text-white border-[#d97706]'
                  : 'bg-white text-text-secondary border-border-light hover:border-text-primary'
              }`}
            >
              {stars} ★ ({stats.distribution[stars] || 0})
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <span className="text-[10px] uppercase text-text-secondary font-bold flex items-center gap-1">
            <ArrowUpDown size={12} /> Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-border-light rounded-xl px-3 py-1.5 text-[11px] font-mono text-text-primary focus:outline-none focus:border-black cursor-pointer"
          >
            <option value="relevant">Most Relevant</option>
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* ── REVIEWS LIST ── */}
      {loading ? (
        <div className="py-16 text-center text-xs text-text-secondary font-mono flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-full border-2 border-black border-t-transparent animate-spin mb-2" />
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        /* Professional Empty State */
        <div className="py-16 px-4 text-center bg-neutral-50 border border-dashed border-border-light rounded-2xl flex flex-col items-center justify-center">
          <div className="flex text-neutral-300 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={20} className="fill-neutral-200" />
            ))}
          </div>
          <h3 className="font-sans font-bold text-sm uppercase text-text-primary tracking-wide">
            {activeRatingFilter ? `No ${activeRatingFilter}-Star Reviews Found` : 'No Reviews Yet'}
          </h3>
          <p className="text-xs text-text-secondary font-mono mt-1 max-w-sm">
            {activeRatingFilter
              ? 'Try selecting a different star rating filter to view other customer feedback.'
              : 'Be the first customer to share your experience with this exclusive piece.'}
          </p>

          {user && eligibility.isEligible && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-gold text-[10px] !py-2.5 !px-6 uppercase tracking-widest font-bold mt-4 cursor-pointer"
            >
              WRITE A REVIEW
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((rev) => {
            const isOwner = user && rev.user?._id && user._id === rev.user._id;

            return (
              <div
                key={rev._id}
                className="p-5 bg-white border border-border-light rounded-2xl space-y-3.5 hover:shadow-xs transition-shadow"
              >
                {/* Review Header: User Info & Rating */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {/* User Avatar */}
                    <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold font-mono text-xs flex items-center justify-center uppercase shrink-0 overflow-hidden">
                      {rev.user?.avatar ? (
                        <img
                          src={resolveImage(rev.user.avatar)}
                          alt={rev.user.name}
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        rev.user?.name ? rev.user.name.charAt(0) : 'C'
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-sans font-bold text-xs uppercase text-text-primary">
                          {rev.user?.name || 'Customer'}
                        </h4>
                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase text-[#16a34a] bg-[#f0fdf4] border border-[#bbf7d0] px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={10} /> Verified Purchase
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] text-text-secondary font-mono">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {/* Star Rating & Title */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex text-[#f5a623]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={13}
                          className={
                            star <= rev.rating ? 'text-[#f5a623] fill-[#f5a623]' : 'text-neutral-300'
                          }
                        />
                      ))}
                    </div>
                    {rev.title && (
                      <h5 className="font-sans font-bold text-xs text-text-primary uppercase tracking-wide">
                        {rev.title}
                      </h5>
                    )}
                  </div>

                  {/* Comment */}
                  <p className="text-xs text-text-secondary font-normal leading-relaxed pt-1 whitespace-pre-line">
                    {rev.comment}
                  </p>

                  {/* Review Photos if any */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {rev.images.map((imgUrl, i) => {
                        const fullUrl = resolveImage(imgUrl);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setLightboxImage(fullUrl)}
                            className="w-16 h-16 rounded-xl overflow-hidden border border-border-light hover:border-black transition-all cursor-pointer group"
                          >
                            <img
                              src={fullUrl}
                              alt="Customer review photo"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Review Footer: Helpful & Report & Owner Edit/Delete */}
                <div className="flex items-center justify-between pt-2 border-t border-border-light text-[11px] font-mono text-text-secondary">
                  <div className="flex items-center gap-4">
                    {/* Helpful Button */}
                    <button
                      onClick={() => handleToggleHelpful(rev._id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        rev.isHelpful
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-white hover:bg-neutral-50 text-text-secondary border-border-light'
                      }`}
                      title="Mark as helpful"
                    >
                      <ThumbsUp size={12} className={rev.isHelpful ? 'fill-white' : ''} />
                      <span>Helpful ({rev.helpfulCount || 0})</span>
                    </button>

                    {/* Report Option */}
                    {!isOwner && (
                      <button
                        onClick={() => handleOpenReportModal(rev._id)}
                        disabled={rev.isReported}
                        className={`flex items-center gap-1 hover:text-red-500 transition-colors cursor-pointer ${
                          rev.isReported ? 'text-red-500 opacity-60 cursor-not-allowed' : ''
                        }`}
                      >
                        <Flag size={11} />
                        <span>{rev.isReported ? 'Reported' : 'Report'}</span>
                      </button>
                    )}
                  </div>

                  {/* Owner Controls */}
                  {isOwner && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-1 text-text-primary hover:text-black font-bold cursor-pointer"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteReview(rev._id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 font-bold cursor-pointer"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Load More Button */}
          {pagination.hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn-dark text-[10px] !py-3 !px-8 uppercase tracking-widest font-bold cursor-pointer"
              >
                {loadingMore ? 'LOADING REVIEWS...' : 'LOAD MORE REVIEWS'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── WRITE/EDIT REVIEW MODAL ── */}
      <WriteReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={productId}
        productName={productName}
        existingReview={eligibility.existingReview}
        onReviewSubmitted={handleReviewSubmitted}
      />

      {/* ── REPORT REVIEW MODAL ── */}
      {reportModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans">
          <div className="fixed inset-0" onClick={() => !isSubmittingReport && setReportModal({ isOpen: false, reviewId: null })} />
          <div className="relative bg-white border border-[#e5e5e5] rounded-3xl max-w-md w-full p-6 shadow-2xl z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                  <Flag size={14} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-tight text-[#111111]">
                    Report Review
                  </h3>
                  <p className="text-[11px] text-[#6b7280]">
                    Help maintain an honest, high-quality community.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReportModal({ isOpen: false, reviewId: null })}
                className="text-[#6b7280] hover:text-[#111111] p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Radio Reasons List */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold uppercase text-[#6b7280] block mb-1">
                Select Violation Reason
              </label>
              {REPORT_REASONS.map((r) => {
                const isSelected = selectedReportReason === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedReportReason(r.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-[#111111] bg-[#f9fafb] shadow-xs'
                        : 'border-[#e5e5e5] hover:border-[#9ca3af] bg-white'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? 'border-[#111111] bg-[#111111]' : 'border-[#d1d5db]'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-[#111111]">{r.label}</p>
                      <p className="text-[10px] text-[#6b7280] leading-tight mt-0.5">{r.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#e5e5e5]">
              <button
                type="button"
                onClick={() => setReportModal({ isOpen: false, reviewId: null })}
                disabled={isSubmittingReport}
                className="px-4 py-2.5 rounded-xl border border-[#e5e5e5] text-xs font-mono font-bold uppercase text-[#6b7280] hover:text-[#111111] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReport}
                disabled={isSubmittingReport || !selectedReportReason}
                className="px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-mono font-bold uppercase tracking-wider shadow-xs cursor-pointer disabled:opacity-40"
              >
                {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PHOTO LIGHTBOX ── */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-pointer"
        >
          <div className="max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl bg-black">
            <img src={lightboxImage} alt="Enlarged review photo" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </section>
  );
}
