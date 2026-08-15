import jwt from 'jsonwebtoken';
import { getCookieOptions } from '../../utils/cookie.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const setCookie = (res, token) => {
  res.cookie('vault_token', token, getCookieOptions(7 * 24 * 60 * 60 * 1000));
};

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'vault.co.6235@gmail.com').toLowerCase();
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    if (email.toLowerCase() !== superAdminEmail || password !== superAdminPassword) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    // Generate Token
    // We use a dummy id 'admin_001' as the super admin doesn't need to be in the database
    const token = generateToken('admin_001');
    setCookie(res, token);

    res.json({
      success: true,
      token,
      data: {
        _id: 'admin_001',
        name: 'Super Admin',
        email: superAdminEmail,
        role: 'admin',
        token,
      },
    });
  } catch (error) {
    console.error('[VAULT] Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error during admin login.' });
  }
};

