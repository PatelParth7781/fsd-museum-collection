import express from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/audit (admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { action, entity_type, limit = 50 } = req.query;
    const query = {};
    if (action) query.action = action;
    if (entity_type) query.entity_type = entity_type;

    const logs = await AuditLog.find(query)
      .populate('user', 'full_name email role')
      .sort('-created_at')
      .limit(Number(limit));

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/audit (staff can log actions)
router.post('/', protect, async (req, res) => {
  try {
    const { action, entity_type, entity_id, details } = req.body;
    const log = await AuditLog.create({
      user_id: req.user._id,
      action,
      entity_type,
      entity_id,
      details,
      ip_address: req.ip || req.headers['x-forwarded-for'] || '',
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
