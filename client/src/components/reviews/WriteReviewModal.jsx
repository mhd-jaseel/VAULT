import React, { useState, useEffect } from 'react';
import { Star, Upload, X, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { resolveImage } from '../../utils/imageHelper';

const RATING_LABELS = {
  1: '1 Star — Very Poor',
  2: '2 Stars — Poor',
  3: '3 Stars — Average',
  4: '4 Stars — Good',
  5: '5 Stars — Excellent',
};

export default function WriteReviewModal({
  isOpen,
  onClose,
  productId,
  productName,
  existingReview = null,
  onReviewSubmitted,
}) {
  const [rating, setRating] = useState(existingReview ? existingReview.rating : 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(existingReview ? existingReview.title || '' : '');
  const [comment, setComment] = useState(existingReview ? existingReview.comment || '' : '');
  const [existingImages, setExistingImages] = useState(existingReview ? existingReview.images || [] : []);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 5);
      setTitle(existingReview.title || '');
      setComment(existingReview.comment || '');
      setExistingImages(existingReview.images || []);
    } else {
      setRating(5);
      setTitle('');
      setComment('');
      setExistingImages([]);
    }
    setSelectedFiles([]);
    setFilePreviews([]);
  }, [existingReview, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const availableSlots = 5 - (existingImages.length + selectedFiles.length);

    if (files.length > availableSlots) {
      toast.warning(`You can only upload up to 5 photos in total.`);
    }

    const validFiles = files.slice(0, Math.max(0, availableSlots));
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating || rating < 1 || rating > 5) {
      toast.error('Please select a star rating.');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please write a review comment.');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('productId', productId);
    formData.append('rating', rating);
    formData.append('title', title.trim());
    formData.append('comment', comment.trim());

    if (existingReview) {
      formData.append('existingImages', JSON.stringify(existingImages));
    }

    selectedFiles.forEach((file) => {
      formData.append('images', file);
    });

    try {
      let res;
      if (existingReview) {
        res = await axios.put(`/reviews/${existingReview._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await axios.post('/reviews', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (res.data.success) {
        toast.success(res.data.message || 'Review submitted successfully!');
        if (onReviewSubmitted) onReviewSubmitted(res.data.data);
        onClose();
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeStarRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-border-light rounded-2xl p-6 max-w-lg w-full shadow-2xl text-[#111111] my-8 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-border-light pb-4 mb-4">
          <div>
            <h3 className="font-sans font-extrabold text-sm uppercase tracking-tight text-[#111111]">
              {existingReview ? 'Edit Your Review' : 'Write a Verified Review'}
            </h3>
            {productName && (
              <p className="text-[10px] text-text-secondary font-mono truncate max-w-xs">{productName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-text-secondary hover:text-text-primary hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          {/* Star Rating Selector */}
          <div className="space-y-1.5 bg-neutral-50 p-4 rounded-xl border border-border-light text-center">
            <label className="text-[10px] text-text-secondary uppercase font-bold tracking-wider block">
              Overall Rating *
            </label>
            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                >
                  <Star
                    size={28}
                    className={
                      star <= activeStarRating
                        ? 'text-[#f5a623] fill-[#f5a623] drop-shadow-xs'
                        : 'text-neutral-300'
                    }
                  />
                </button>
              ))}
            </div>
            <p className="text-[11px] font-bold text-text-primary uppercase tracking-wide">
              {RATING_LABELS[activeStarRating] || 'Select your rating'}
            </p>
          </div>

          {/* Review Title */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">
                Review Headline (Optional)
              </label>
              <span className="text-[9px] text-text-secondary">{title.length}/100</span>
            </div>
            <input
              type="text"
              placeholder="e.g. Masterpiece craftsmanship, perfect fit"
              className="w-full bg-[#f9fafb] border border-border-light rounded-xl px-3.5 py-2.5 text-xs font-sans text-text-primary focus:bg-white focus:outline-none focus:border-text-primary transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              maxLength={100}
            />
          </div>

          {/* Review Comment */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">
                Your Detailed Review *
              </label>
              <span className="text-[9px] text-text-secondary">{comment.length}/2000</span>
            </div>
            <textarea
              placeholder="Tell other customers about the material quality, comfort, finish, and everyday feel..."
              rows={4}
              className="w-full bg-[#f9fafb] border border-border-light rounded-xl p-3 text-xs font-sans text-text-primary focus:bg-white focus:outline-none focus:border-text-primary transition-all leading-relaxed"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 2000))}
              maxLength={2000}
              required
            />
          </div>

          {/* Image Upload Gallery (Up to 5 images) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">
                Photos (Optional &bull; Max 5)
              </label>
              <span className="text-[9px] text-text-secondary">
                {existingImages.length + selectedFiles.length}/5 uploaded
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {/* Existing Images */}
              {existingImages.map((imgUrl, idx) => (
                <div key={`existing-${idx}`} className="relative w-16 h-16 rounded-xl overflow-hidden border border-border-light group">
                  <img
                    src={resolveImage(imgUrl)}
                    alt="Upload"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(idx)}
                    className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 hover:bg-black transition-opacity"
                    title="Remove"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* New Selected File Previews */}
              {filePreviews.map((previewUrl, idx) => (
                <div key={`new-${idx}`} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#d97706]/40 group">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewFile(idx)}
                    className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 hover:bg-black transition-opacity"
                    title="Remove"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* Upload Button Tile */}
              {existingImages.length + selectedFiles.length < 5 && (
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-border-light hover:border-text-primary bg-[#f9fafb] flex flex-col items-center justify-center cursor-pointer transition-colors text-text-secondary hover:text-text-primary">
                  <Upload size={16} />
                  <span className="text-[8px] uppercase tracking-wider mt-1 font-bold">Add</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Notice */}
          <div className="p-3 bg-neutral-50 border border-border-light rounded-xl flex items-start gap-2 text-[10px] text-text-secondary">
            <AlertCircle size={14} className="shrink-0 text-text-primary mt-0.5" />
            <span>
              Your review is verified from your delivered purchase. It helps our community maintain high product quality.
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-border-light flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-xs text-text-secondary hover:text-text-primary font-bold uppercase transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-gold text-[10px] !py-2.5 !px-6 uppercase tracking-widest font-bold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  SUBMITTING...
                </>
              ) : existingReview ? (
                'UPDATE REVIEW'
              ) : (
                'SUBMIT REVIEW'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
