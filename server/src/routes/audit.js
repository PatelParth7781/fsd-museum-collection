import express from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/audit (admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { action, entity_type, search, page, limit = 50 } = req.query;
    const query = {};
    if (action) query.action = action;
    if (entity_type) query.entity_type = entity_type;

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
        { entity_type: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await AuditLog.countDocuments(query);
    let logQuery = AuditLog.find(query)
      .populate('user', 'id full_name email role')
      .sort('-created_at');

    if (page) {
      const skip = (Number(page) - 1) * Number(limit);
      logQuery = logQuery.skip(skip).limit(Number(limit));
    } else {
      logQuery = logQuery.limit(Number(limit));
    }

    const logs = await logQuery;

    res.json({
      data: logs,
      count: total,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/audit (staff can log actions)
router.post('/', protect, async (req, res) => {
  try {
    const { action, entity_type, entity_id, details, description } = req.body;
    const log = await AuditLog.create({
      user_id: req.user._id,
      action,
      entity_type,
      entity_id,
      details: details || description || '',
      description: description || details || '',
      ip_address: req.ip || req.headers['x-forwarded-for'] || '',
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
