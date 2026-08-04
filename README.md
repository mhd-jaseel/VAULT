# VAULT - Premium Men's Accessories E-Commerce

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.0.0-blue.svg)](https://nodejs.org)
[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?logo=vite&logoColor=white)](#)
[![React](https://img.shields.io/badge/react-%2320232a.svg?logo=react&logoColor=%2361DAFB)](#)

VAULT is a production-grade, premium E-Commerce platform for Men's Accessories. It is built using the MERN stack (MongoDB, Express, React, Node.js) with Vite, Tailwind CSS, Mongoose, and Lucide icons.

---

## 🌟 Key Features

### 🛒 Customer Storefront
- **Premium Catalog browsing**: Responsive product cards featuring luxury strike-through pricing, discount badges, and active countdown timers.
- **Limited Time Deals Carousel**: Mobile-optimized, touch-swipe active offers carousel showing 1 card at a time with smooth translation slides and auto-slide animations.
- **Dynamic Wishlist & Cart**: Instantly add items to cart or toggle items in the wishlist with alerts.
- **Eligibility Validation Checkout**: Validates stock levels, user purchase limits, coupon codes, and shipping fees.

### 🛡️ Admin Dashboard & Control Center
- **Access Control (RBAC)**: Enforced security restrictions, ensuring admin logins redirect immediately to the Admin Dashboard while blocking access to customer-only endpoints (cart, wishlist, orders, checkout).
- **Discount Management System**:
  - Setup Product, Category, or Multi-selected product discounts.
  - Choose between Percentage (%) or Fixed Amount (₹) discounts.
  - Enable countdown clocks with validation checks on End Dates.
  - Toggle whether campaigns are featured on the homepage.
- **Coupon Management Module**: Search, paginate, toggle status, and soft-delete user coupons.
- **Live Preview Modes**: "Home Page Preview" and "Product Page Preview" links inside the dashboard to browse client-side views safely.

---

## 📂 Repository Directory Layout

```
├── client/                 # React frontend (Vite, Tailwind, Context API)
│   ├── src/
│   │   ├── components/     # Reusable UI components (Countdown, Header, Pagination)
│   │   ├── context/        # React context (Auth, Cart, Socket)
│   │   ├── pages/          # Layout pages (Shop, ProductDetails, Profile)
│   │   │   └── admin/      # Admin dashboards (AdminDiscounts, AdminCoupons, etc.)
│   │   └── App.jsx         # App routing registry
│   └── package.json
│
├── server/                 # Express REST backend API
│   ├── controllers/        # Request handlers & logic
│   ├── models/             # Mongoose schemas (User, Product, Coupon, Discount)
│   ├── routes/             # REST route mapping
│   ├── services/           # Business logic layer (discountService, paginate)
│   ├── middleware/         # Security & RBAC middlewares (isAdmin, isCustomer)
│   └── package.json
│
└── package.json            # Root workspace config
```

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- MongoDB installed locally or MongoDB Atlas connection string

### Setup Environment Variables
Configure environmental variables inside [server/.env](file:///c:/Users/HP%20ZBook%20Power%20G7/OneDrive/Desktop/vault/server/.env) based on the [server/.env.example](file:///c:/Users/HP%20ZBook%20Power%20G7/OneDrive/Desktop/vault/server/.env.example):
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_uri
JWT_SECRET=your_jwt_secret_key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password
FRONTEND_URL=http://localhost:5173
```

### Install Dependencies
Run the install command at the root workspace:
```bash
npm install
npm install --prefix client
npm install --prefix server
```

### Run Locally (Development)
Start both servers:
```bash
# Run backend server
cd server && npm run dev

# Run frontend client
cd client && npm run dev
```

---

## 🛡️ Backend Security & RBAC
- **Token Verification**: Tokens are securely authenticated using jsonwebtoken header keys on the backend.
- **Role Enforcement**: APIs are explicitly segregated via role validators:
  - `isAdmin`: Restricts admin endpoints (Product, Category, Settings configuration updates).
  - `isCustomer`: Prevents admin accounts from writing to customer-only endpoints (Order placement, Wishlist updates, Reviews postings).

---

## 📄 License
This project is licensed under the MIT License. See [LICENSE](file:///c:/Users/HP%20ZBook%20Power%20G7/OneDrive/Desktop/vault/LICENSE) for more details.
