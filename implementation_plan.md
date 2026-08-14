# Professional Product Review System & Review Cleanup

Upgrade the existing basic review system into a production-ready customer review & rating system with purchase verification, rating breakdown, image uploads, helpful voting, report mechanism, and admin moderation, followed by total cleanup of hardcoded/dummy reviews.

## User Review Required
- Reviews will default to `approved` (or `reported` if flagged) for immediate visibility upon verified purchase submission, while allowing Admins to view, approve, reject, hide, or delete reviews from the Admin Moderation dashboard (`/admin/reviews`).
- Eligibility rule: Only authenticated users who have purchased the item in a valid completed/delivered order where the item is active (not cancelled, not refunded/returned) can submit/edit reviews.
- Exactly 1 review per product purchase per user.

---

## Proposed Changes

### Backend

#### [MODIFY] [Review.js](file:///c:/Users/HP/ZBook/Power/G7/OneDrive/Desktop/vault/server/models/Review.js)
- Upgrade schema:
  - `product` (ObjectId ref Product, required)
  - `user` (ObjectId ref User, required)
  - `order` (ObjectId ref Order)
  - `rating` (Number 1-5, required)
  - `title` (String, max 100 chars, trimmed)
  - `comment` (String, max 2000 chars, required)
  - `images` ([String] - up to 5 images)
  - `isVerifiedPurchase` (Boolean, default false)
  - `status` (Enum: `['pending', 'approved', 'rejected', 'hidden']`, default `'approved'`)
  - `helpfulVotes` ([{ type: ObjectId, ref: 'User' }])
  - `helpfulCount` (Number, default 0)
  - `reports` ([{ user: { type: ObjectId, ref: 'User' }, reason: String, createdAt: Date }])
  - `reportCount` (Number, default 0)
  - Indexes: `{ product: 1, status: 1 }`, `{ user: 1 }`, `{ product: 1, user: 1 } (unique)`.

#### [MODIFY] [reviewController.js](file:///c:/Users/HP/ZBook/Power/G7/OneDrive/Desktop/vault/server/controllers/reviewController.js)
- `getProductReviews(req, res)`:
  - Query parameters: `page`, `limit` (default 10), `rating` (1-5 filter), `sortBy` (`relevant`, `newest`, `highest`, `lowest`, `helpful`).
  - Calculate real rating statistics aggregation: `averageRating`, `totalReviews`, `ratingDistribution` (counts & percentages for 5, 4, 3, 2, 1 stars).
  - Return review items with user name, avatar, verified badge, images, helpful status for current logged-in user.
- `checkEligibility(req, res)`:
  - Verifies if the authenticated user has purchased the product with eligible delivered order and whether they already reviewed it.
- `createReview(req, res)`:
  - Strict purchase verification against delivered Order & Order item.
  - Duplication check.
  - Image upload support via Multer (up to 5 images).
  - Recalculate product rating average & count.
- `updateReview(req, res)`:
  - Edit rating, title, comment, images (only owner).
  - Recalculate product rating.
- `deleteReview(req, res)`:
  - Delete review (owner or admin).
  - Recalculate product rating.
- `toggleHelpful(req, res)`:
  - Toggle helpful vote atomically (increment/decrement count, toggle user ID in `helpfulVotes`).
- `reportReview(req, res)`:
  - Record user report with reason, prevent duplicate reports from the same user.
- Admin Moderation Controllers:
  - `getAdminReviews(req, res)`: Paginated with filters (status, product, search, reported).
  - `updateReviewStatus(req, res)`: Approve, Reject, Hide.
  - `adminDeleteReview(req, res)`.

#### [MODIFY] [reviewRoutes.js](file:///c:/Users/HP/ZBook/Power/G7/OneDrive/Desktop/vault/server/routes/reviewRoutes.js)
- Register public, protected customer, and admin moderation routes with Multer upload middleware.

---

### Frontend

#### [NEW] [ReviewSection.jsx](file:///c:/Users/HP/ZBook/Power/G7/OneDrive/Desktop/vault/client/src/components/reviews/ReviewSection.jsx)
- Top Rating Overview:
  - Large calculated average rating (e.g. 4.8 ★)
  - Total real reviews count
  - Star rating visualization & dynamic percentage progress bars (5★ to 1★)
  - Rating filter pills: `[All] [5★] [4★] [3★] [2★] [1★]`
  - Sort dropdown: `Most Relevant`, `Newest`, `Highest Rating`, `Lowest Rating`, `Most Helpful`
  - "WRITE A REVIEW" button (opens modern modal drawer).
- Review List:
  - User avatar, name, `✓ Verified Purchase` badge, date.
  - Star rating, review title, detailed comment.
  - Review photo gallery with lightbox/preview.
  - 👍 Helpful button with dynamic vote toggle & count.
  - Report button with prompt modal.
  - Edit / Delete buttons for review owner.
- Pagination / "Load More Reviews" UX.
- Premium Empty State: "No reviews yet. Be the first customer to share your experience."

#### [NEW] [WriteReviewModal.jsx](file:///c:/Users/HP/ZBook/Power/G7/OneDrive/Desktop/vault/client/src/components/reviews/WriteReviewModal.jsx)
- Interactive 1–5 Star selector with descriptive hover/selected text (e.g., 5 Stars - Excellent).
- Review Title & Experience Textarea with length limits.
- Multi-photo upload with thumbnail preview & remove button (up to 5 images).
- Clean submission state & validation.

#### [NEW] [AdminReviews.jsx](file:///c:/Users/HP/ZBook/Power/G7/OneDrive/Desktop/vault/client/src/pages/admin/AdminReviews.jsx)
- Admin review dashboard showing Product, Customer, Rating, Verified Purchase status, Review title & preview, Report count, Status badge (`Approved`, `Pending`, `Reported`, `Hidden`, `Rejected`).
- Actions: View details drawer, Approve, Reject, Hide, Delete.

#### [MODIFY] [ProductDetails.jsx](file:///c:/Users/HP/ZBook/Power/G7/OneDrive/Desktop/vault/client/src/pages/ProductDetails.jsx)
- Replace basic old review block with `<ReviewSection productId={product._id} />`.

#### [MODIFY] [OrderTracking.jsx](file:///c:/Users/HP/ZBook/Power/G7/OneDrive/Desktop/vault/client/src/pages/OrderTracking.jsx)
- Add "Write a Review" / "View Review" action button for delivered items.

#### [MODIFY] [AdminSidebar.jsx](file:///c:/Users/HP/ZBook/Power/G7/OneDrive/Desktop/vault/client/src/components/AdminSidebar.jsx) & [App.jsx](file:///c:/Users/HP/ZBook/Power/G7/OneDrive/Desktop/vault/client/src/App.jsx)
- Add "Customer Reviews" navigation item under `MARKETING` or `CUSTOMERS` and `/admin/reviews` route.

---

### Review System Cleanup

1. Verify and eliminate any dummy review arrays, mock review objects, fake static star counts, or fake reviews in frontend and seed files.
2. Remove old review form markup and unused review state variables from `ProductDetails.jsx`.
3. Preserve all legitimate database reviews.

---

## Verification Plan

### Automated / Build Tests
- Execute `npm run build` in `client` to verify zero compile or bundle errors.
- Test review endpoints via Node.js invocation / API checks.

### Functional Verification
- Verify unauthenticated user prompt vs authenticated eligible purchaser review flow.
- Verify non-purchasers or cancelled orders cannot submit reviews.
- Verify 1 review per product constraint.
- Test helpful voting toggle and duplicate report prevention.
- Test admin moderation (Approve, Reject, Hide, Delete) and dynamic product rating recalculation.
