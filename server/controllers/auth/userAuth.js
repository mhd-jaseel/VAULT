import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import { OAuth2Client } from 'google-auth-library';
import { getCookieOptions, clearCookieOptions } from '../../utils/cookie.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const setCookie = (res, token) => {
  res.cookie('vault_token', token, getCookieOptions(30 * 24 * 60 * 60 * 1000));
};

export const googleLogin = async (req, res) => {
  const credential = req.body.credential || req.body.token;

  if (!credential) {
    return res.status(400).json({ success: false, message: 'Missing Google credential.' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId, email_verified } = payload;

    if (!email_verified) {
      return res.status(401).json({ success: false, message: 'Google email is not verified. Cannot authenticate.' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      if (user.isBlocked) {
        return res.status(403).json({ success: false, message: 'Your account is blocked.' });
      }
      
      if (user.googleId && user.googleId !== googleId) {
        return res.status(401).json({ success: false, message: 'Authentication mismatch. Please login with the original account.' });
      }

      // Link Google Account to local account if needed
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        authProvider: 'google',
        googleId,
      });
    }

    const token = generateToken(user._id);
    setCookie(res, token);

    res.json({
      success: true,
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        token,
      },
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(400).json({ success: false, message: 'Google Authentication failed.' });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({ success: true, data: user });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      if (req.body.address) {
        user.address = {
          street: req.body.address.street || user.address?.street,
          city: req.body.address.city || user.address?.city,
          state: req.body.address.state || user.address?.state,
          zip: req.body.address.zip || user.address?.zip,
          country: req.body.address.country || user.address?.country || 'India',
        };
      }

      const updatedUser = await user.save();
      res.json({
        success: true,
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          phone: updatedUser.phone,
          address: updatedUser.address,
        },
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logoutUser = (req, res) => {
  res.cookie('vault_token', '', clearCookieOptions());
  res.json({ success: true, message: 'Logged out successfully' });
};

