import express from 'express';
import User from '../models/User.js';
import { protect, isSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

const getSuperAdminEmail = () => (process.env.ADMIN_EMAIL || 'vault.co.6235@gmail.com').toLowerCase();

// GET /api/admin-management/users — Search and list registered non-admin users for promotion
router.get('/users', protect, isSuperAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    const superEmail = getSuperAdminEmail();

    const query = {
      role: { $ne: 'admin' },
      email: { $ne: superEmail },
    };

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formattedUsers = users.map((u) => ({
      ...u,
      status: u.isBlocked ? 'disabled' : 'active',
      loginMethod: u.googleId ? 'Google OAuth' : 'Email/Password',
    }));

    res.json({
      success: true,
      data: formattedUsers,
    });
  } catch (error) {
    console.error('[VAULT] fetch promotable users error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin-management/admins — List all database-promoted admin accounts
router.get('/admins', protect, isSuperAdmin, async (req, res) => {
  try {
    const superEmail = getSuperAdminEmail();

    const admins = await User.find({ role: 'admin' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    const formattedAdmins = admins.map((adm) => ({
      ...adm,
      isSuperAdmin: adm.email.toLowerCase() === superEmail,
      status: adm.isBlocked ? 'disabled' : 'active',
      loginMethod: adm.googleId ? 'Google OAuth' : 'Email/Password',
    }));

    res.json({
      success: true,
      data: formattedAdmins,
    });
  } catch (error) {
    console.error('[VAULT] fetch admins error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin-management/:id/make-admin — Promote an existing user to admin
router.put('/:id/make-admin', protect, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await User.findById(id);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    const superEmail = getSuperAdminEmail();
    if (targetUser.email.toLowerCase() === superEmail) {
      return res.status(400).json({ success: false, message: 'Super Admin account is already configured.' });
    }

    if (targetUser.role === 'admin') {
      return res.status(400).json({ success: false, message: 'User is already an administrator.' });
    }

    if (targetUser.isBlocked) {
      return res.status(400).json({ success: false, message: 'Cannot promote a blocked user to administrator.' });
    }

    targetUser.role = 'admin';
    await targetUser.save();

    res.json({
      success: true,
      message: `${targetUser.name} (${targetUser.email}) promoted to administrator successfully.`,
      data: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error) {
    console.error('[VAULT] make admin error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin-management/:id/remove-admin — Demote an admin back to normal customer
router.put('/:id/remove-admin', protect, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await User.findById(id);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    const superEmail = getSuperAdminEmail();
    if (targetUser.email.toLowerCase() === superEmail) {
      return res.status(403).json({ success: false, message: 'Super Admin account cannot be demoted or removed.' });
    }

    if (targetUser.role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Account is not an administrator.' });
    }

    targetUser.role = 'customer';
    await targetUser.save();

    res.json({
      success: true,
      message: `Admin access removed for ${targetUser.name}. Account is now a normal customer.`,
      data: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error) {
    console.error('[VAULT] remove admin error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin-management/:id/status — Toggle activate / disable admin
router.put('/:id/status', protect, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'disabled'

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const superEmail = getSuperAdminEmail();
    if (targetUser.email.toLowerCase() === superEmail) {
      return res.status(403).json({ success: false, message: 'Super Admin account cannot be disabled.' });
    }

    targetUser.isBlocked = status === 'disabled';
    await targetUser.save();

    res.json({
      success: true,
      message: `Admin account ${status === 'disabled' ? 'disabled' : 'activated'} successfully`,
      data: {
        _id: targetUser._id,
        email: targetUser.email,
        isBlocked: targetUser.isBlocked,
      },
    });
  } catch (error) {
    console.error('[VAULT] admin status toggle error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
