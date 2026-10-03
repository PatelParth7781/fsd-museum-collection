import express from 'express';
import { HistoricalPeriod } from '../models/HistoricalPeriod.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const periods = await HistoricalPeriod.find().sort('start_year');
    res.json(periods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const period = await HistoricalPeriod.findById(req.params.id);
    if (!period) return res.status(404).json({ error: 'Period not found' });
    res.json(period);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', protect, authorize('admin', 'curator'), async (req, res) => {
  try {
    const period = await HistoricalPeriod.create(req.body);
    res.status(201).json(period);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', protect, authorize('admin', 'curator'), async (req, res) => {
  try {
    const period = await HistoricalPeriod.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!period) return res.status(404).json({ error: 'Period not found' });
    res.json(period);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const period = await HistoricalPeriod.findByIdAndDelete(req.params.id);
    if (!period) return res.status(404).json({ error: 'Period not found' });
    res.json({ message: 'Period deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
