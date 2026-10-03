import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Default to 'visitor', only allow role override if none exists (first user can be admin)
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'admin' : role || 'visitor';

    const user = await User.create({
      email,
      password,
      full_name: full_name || '',
      role: assignedRole,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar_url: user.avatar_url,
        is_active: user.is_active,
        created_at: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'This account has been deactivated' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar_url: user.avatar_url,
        is_active: user.is_active,
        created_at: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

// GET /api/auth/users (admin only)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/auth/users/:id (admin only)
router.put('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, is_active, full_name } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (role) user.role = role;
    if (typeof is_active === 'boolean') user.is_active = is_active;
    if (full_name) user.full_name = full_name;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/auth/users/:id (admin only)
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
