# Implementation Plan - VAULT: Premium Men's Accessories E-commerce

This plan outlines the architecture, data models, API endpoints, frontend views, and real-time socket mechanics for the VAULT premium accessories e-commerce website.

## User Review Required

> [!IMPORTANT]
> **Tailwind CSS Configuration**: The project requested Tailwind CSS. We will initialize a React frontend using Vite and configure Tailwind CSS v3/v4 to achieve the luxury styling (Black, Gold, White, Glassmorphism, smooth animations).
> **Uploads**: Images for products, categories, and payment screenshots will be saved locally in the backend's `uploads/` directory for simplicity, using Express static middleware.
> **Database**: We will use local MongoDB or standard MongoDB Atlas connection via `MONGODB_URI` specified in the `.env` file. We will include a seed database script or default admin user creation at startup.

## Open Questions

None at the moment. We will proceed with the proposed modular architecture.

---

## Proposed Changes

### Database & Models Setup

We will create Mongoose models in `server/models/`:
* `User.js`: User accounts (roles: `customer`, `admin`).
* `Category.js`: Category schema (name, description, image).
* `Product.js`: Product details (name, description, price, category, stock, images, ratings).
* `Order.js`: Details of items, total, shipping details, payment method, order status, timeline tracking.
* `Payment.js`: UPI Transaction ID, uploaded screenshot path, status (`pending`, `verified`, `rejected`), associated order.
* `Notification.js`: Notification message, user, read/unread status, type.
* `Wishlist.js`: User's saved product items.
* `Review.js`: Product reviews, ratings, user reference.
* `Setting.js`: Store settings (name, logo, phone, WhatsApp number, UPI ID, UPI QR Code, shipping charges).

---

### Backend Components

#### 1. Configuration & Utilities (`server/config/`, `server/utils/`)
* Database connection configuration.
* Socket.io setup module.
* Seed scripts for admin user.

#### 2. Middleware (`server/middleware/`)
* `auth.js`: JWT token verification and roles verification (`isAdmin`).
* `upload.js`: Multer storage configuration for handling image uploads.
* `validate.js`: Express Validator schemas for request body validations.

#### 3. Controllers & Routes (`server/controllers/`, `server/routes/`)
* `auth`: Register, login, forgot password, profile retrieval/update.
* `products`: Public browse, search, filters, category-wise, plus admin CRUD.
* `categories`: CRUD for admin, list for customers.
* `orders`: Order creation, history, tracking status update.
* `payments`: Payment registration (screenshot/UPI transaction ID), verification/rejection.
* `notifications`: Retrieve user or admin notifications.
* `settings`: Admin settings management, public store info retrieval.

#### 4. Socket Integration (`server/socket/`)
* Socket connection listener, room joining by User ID, and helper functions to emit status updates.

---

### Frontend Components

#### 1. Context & Routing (`client/src/context/`, `client/src/routes/`)
* `AuthContext`: Manages login status, token, user profile, and active permissions.
* `CartContext`: Manages items added, quantities, and persistent localStorage sync.
* `SocketContext`: Setup socket connection, listen for real-time notifications.
* Router configuration with protected routes for dashboard and admin views.

#### 2. Layouts & Themes (`client/src/layouts/`, `client/src/components/`)
* Layout components: `Layout` (with header, footer, bottom navigation for mobile, notification drawer).
* Premium theme components using gold accent colors (`#D4AF37`), dark styling, and rich glassmorphism.

#### 3. Core Pages (`client/src/pages/`)
* Home, shop (catalog with search/filter/sort), product details, cart, checkout, payment upload, order success with WhatsApp integration.
* Order history, tracking, notifications, customer profile.
* **Admin Panel**: Dashboard stats, product CRUD, category CRUD, order management, payment verification, notifications log, settings.

---

## Verification Plan

### Automated Tests
* None specified. We will perform interactive verification.

### Manual Verification
* Start server and client locally.
* Test registration, login, and profile modification.
* Check product filtering, search, and sorting on mobile viewports.
* Run through checkout process using manual UPI upload: upload a sample screenshot, input transaction ID, and check admin status.
* Check real-time Socket.IO notifications: trigger an order update from Admin Panel and watch the customer receive the badge update immediately.
* Click checkout WhatsApp confirmation and verify link structure.
