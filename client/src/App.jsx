import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

// Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layout
import Layout from './layouts/Layout';

// Guard routes
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Primary Instant-Load Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Login from './pages/Login';

// Lazy Loaded Customer Pages (Code-Split for performance)
const Wishlist = React.lazy(() => import('./pages/Wishlist'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const OrderSuccess = React.lazy(() => import('./pages/OrderSuccess'));
const Profile = React.lazy(() => import('./pages/Profile'));
const OrderTracking = React.lazy(() => import('./pages/OrderTracking'));
const About = React.lazy(() => import('./pages/About'));
const MyReturns = React.lazy(() => import('./pages/MyReturns'));
const ReturnDetails = React.lazy(() => import('./pages/ReturnDetails'));
const MyWallet = React.lazy(() => import('./pages/MyWallet'));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const Blocked = React.lazy(() => import('./pages/Blocked'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const Forbidden = React.lazy(() => import('./pages/Forbidden'));

// Lazy Loaded Admin Pages (Completely isolated chunk for customer bundle savings)
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminCategories = React.lazy(() => import('./pages/admin/AdminCategories'));
const AdminProducts = React.lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = React.lazy(() => import('./pages/admin/AdminOrders'));
const AdminPayments = React.lazy(() => import('./pages/admin/AdminPayments'));
const AdminShippingSettings = React.lazy(() => import('./pages/admin/AdminShippingSettings'));
const AdminCampaigns = React.lazy(() => import('./pages/admin/AdminCampaigns'));
const AdminBrands = React.lazy(() => import('./pages/admin/AdminBrands'));
const AdminCoupons = React.lazy(() => import('./pages/admin/AdminCoupons'));
const AdminDiscounts = React.lazy(() => import('./pages/admin/AdminDiscounts'));
const AdminAnnouncement = React.lazy(() => import('./pages/admin/AdminAnnouncement'));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'));
const AdminUserDetail = React.lazy(() => import('./pages/admin/AdminUserDetail'));
const AdminReviews = React.lazy(() => import('./pages/admin/AdminReviews'));
const AdminAbout = React.lazy(() => import('./pages/admin/AdminAbout'));
const AdminReturns = React.lazy(() => import('./pages/admin/AdminReturns'));
const AdminSalesReport = React.lazy(() => import('./pages/admin/AdminSalesReport'));
const AdminManagement = React.lazy(() => import('./pages/admin/AdminManagement'));
const AdminTransactions = React.lazy(() => import('./pages/admin/AdminTransactions'));
const AdminNotificationsPage = React.lazy(() => import('./pages/admin/AdminNotificationsPage'));

import ErrorBoundary from './components/ErrorBoundary';

const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
    <div className="w-8 h-8 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin" />
    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Loading VAULT.CO</span>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Toaster richColors closeButton position="top-right" theme="dark" />
      <AuthProvider>
        <CartProvider>
          <Layout>
            <React.Suspense fallback={<PageLoader />}>
              <Routes>
                  {/* Public Catalog Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                
                {/* Authentication Routes */}
                <Route path="/login" element={<Login />} />

                {/* Protected Customer Routes */}
                <Route 
                  path="/wishlist" 
                  element={
                    <ProtectedRoute>
                      <Wishlist />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/checkout" 
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/order-success" 
                  element={
                    <ProtectedRoute>
                      <OrderSuccess />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/order-success/:orderId" 
                  element={
                    <ProtectedRoute>
                      <OrderSuccess />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/order-tracking/:orderId" 
                  element={
                    <ProtectedRoute>
                      <OrderTracking />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/my-returns" 
                  element={
                    <ProtectedRoute>
                      <MyReturns />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/returns-cancellations" 
                  element={
                    <ProtectedRoute>
                      <MyReturns />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/returns/:id" 
                  element={
                    <ProtectedRoute>
                      <ReturnDetails />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/wallet" 
                  element={
                    <ProtectedRoute>
                      <MyWallet />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/my-wallet" 
                  element={
                    <ProtectedRoute>
                      <MyWallet />
                    </ProtectedRoute>
                  } 
                />


                <Route 
                  path="/admin" 
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/dashboard" 
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/announcement" 
                  element={
                    <AdminRoute>
                      <AdminAnnouncement />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/categories" 
                  element={
                    <AdminRoute>
                      <AdminCategories />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/products" 
                  element={
                    <AdminRoute>
                      <AdminProducts />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/orders" 
                  element={
                    <AdminRoute>
                      <AdminOrders />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/payments" 
                  element={
                    <AdminRoute>
                      <AdminPayments />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/shipping" 
                  element={
                    <AdminRoute>
                      <AdminShippingSettings />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/campaigns" 
                  element={
                    <AdminRoute>
                      <AdminCampaigns />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/brands" 
                  element={
                    <AdminRoute>
                      <AdminBrands />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/coupons" 
                  element={
                    <AdminRoute>
                      <AdminCoupons />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/discounts" 
                  element={
                    <AdminRoute>
                      <AdminDiscounts />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/users" 
                  element={
                    <AdminRoute>
                      <AdminUsers />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/reviews" 
                  element={
                    <AdminRoute>
                      <AdminReviews />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/about" 
                  element={
                    <AdminRoute>
                      <AdminAbout />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/users/:id" 
                  element={
                    <AdminRoute>
                      <AdminUserDetail />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/returns" 
                  element={
                    <AdminRoute>
                      <AdminReturns />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/sales-report" 
                  element={
                    <AdminRoute>
                      <AdminSalesReport />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/admin-management" 
                  element={
                    <AdminRoute>
                      <AdminManagement />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/transactions" 
                  element={
                    <AdminRoute>
                      <AdminTransactions />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/notifications" 
                  element={
                    <AdminRoute>
                      <AdminNotificationsPage />
                    </AdminRoute>
                  } 
                />
                {/* Public blocked account page */}
                <Route path="/blocked" element={<Blocked />} />

                {/* 403 Forbidden Route */}
                <Route path="/403" element={<Forbidden />} />

                {/* 404 Catch-All Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </React.Suspense>
            </Layout>
        </CartProvider>
      </AuthProvider>
    </Router>
  </ErrorBoundary>
  );
}

export default App;
