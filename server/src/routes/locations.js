import express from 'express';
import { Location } from '../models/Location.js';
import { Artifact } from '../models/Artifact.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const locations = await Location.find().sort('building gallery');
    const counts = await Artifact.aggregate([
      { $match: { current_location_id: { $ne: null } } },
      { $group: { _id: '$current_location_id', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));
    const result = locations.map((loc) => {
      const obj = loc.toJSON();
      obj.artifact_count = countMap.get(loc._id.toString()) || 0;
      return obj;
    });
    res.json(result);
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
    await Artifact.updateMany(
      { current_location_id: req.params.id },
      { $set: { current_location_id: null } }
    );
    res.json({ message: 'Location deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
