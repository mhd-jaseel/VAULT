import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import rateLimit from 'express-rate-limit';

// Rate Limiting Middlewares
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 OTP requests per hour
  message: { success: false, message: 'Too many OTP requests, please try again later.' },
});

// Rate limiter for cart validation and add-to-cart operations:
// Allows normal responsive shopping actions (60 requests per 1 minute window) while blocking rapid automated/spam click attacks.
export const addToCartLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 60, // 60 requests per minute
  message: { success: false, message: 'Too many cart requests. Please slow down and try again in a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const protect = async (req, res, next) => {
  let token;
  
  // 1. Check cookies for token
  if (req.cookies && req.cookies.vault_token) {
    token = req.cookies.vault_token;
  } 
  // 2. Fallback to Bearer token
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      // Block check — enforced on every authenticated request
      if (req.user.isBlocked) {
        return res.status(403).json({
          success: false,
          blocked: true,
          message: 'Your account has been blocked. Please contact the administrator for assistance.',
        });
      }
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied: Admin only' });
  }
};

export const isSuperAdmin = (req, res, next) => {
  const superAdminEmail = (process.env.ADMIN_EMAIL || 'vault.co.6235@gmail.com').toLowerCase();
  
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  // Ensure they are marked as admin AND match the super admin email
  if (req.user.role === 'admin' && req.user.email.toLowerCase() === superAdminEmail) {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Super Admin access required.' });
  }
};

export const isCustomer = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied: Customer feature' });
  }
};
