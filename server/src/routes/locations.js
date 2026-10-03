import express from 'express';
import { Location } from '../models/Location.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const locations = await Location.find().sort('building gallery');
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).json({ error: 'Location not found' });
    res.json(location);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', protect, authorize('admin', 'curator'), async (req, res) => {
  try {
    const location = await Location.create(req.body);
    res.status(201).json(location);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', protect, authorize('admin', 'curator'), async (req, res) => {
  try {
    const location = await Location.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!location) return res.status(404).json({ error: 'Location not found' });
    res.json(location);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location) return res.status(404).json({ error: 'Location not found' });
    res.json({ message: 'Location deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
