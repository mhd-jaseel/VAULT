import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

// Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';

// Layout
import Layout from './layouts/Layout';

// Guard routes
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import ManualPayment from './pages/ManualPayment';
import OrderSuccess from './pages/OrderSuccess';
import Profile from './pages/Profile';
import OrderTracking from './pages/OrderTracking';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import About from './pages/About';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCategories from './pages/admin/AdminCategories';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminPayments from './pages/admin/AdminPayments';
import AdminSettings from './pages/admin/AdminSettings';
import AdminCampaigns from './pages/admin/AdminCampaigns';
import AdminBrands from './pages/admin/AdminBrands';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminDiscounts from './pages/admin/AdminDiscounts';

function App() {
  return (
    <Router>
      <Toaster richColors closeButton position="top-right" theme="dark" />
      <AuthProvider>
        <CartProvider>
          <SocketProvider>
            <Layout>
              <Routes>
                {/* Public Catalog Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/about" element={<About />} />
                
                {/* Authentication Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

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
                  path="/payment-upload/:orderId" 
                  element={
                    <ProtectedRoute>
                      <ManualPayment />
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
                  path="/admin/settings" 
                  element={
                    <AdminRoute>
                      <AdminSettings />
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
              </Routes>
            </Layout>
          </SocketProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
