import express from 'express';
import { Exhibition } from '../models/Exhibition.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const exhibitions = await Exhibition.find(query)
      .populate('location')
      .populate('curator', 'full_name email')
      .populate({
        path: 'exhibition_artifacts.artifact_id',
        model: 'Artifact',
        populate: { path: 'artifact_images' },
      })
      .sort('-start_date');

    res.json(exhibitions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id)
      .populate('location')
      .populate('curator', 'full_name email')
      .populate({
        path: 'exhibition_artifacts.artifact_id',
        model: 'Artifact',
        populate: { path: 'artifact_images' },
      });

    if (!exhibition) return res.status(404).json({ error: 'Exhibition not found' });
    res.json(exhibition);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', protect, authorize('admin', 'curator'), async (req, res) => {
  try {
    const exhibition = await Exhibition.create({
      ...req.body,
      curator_id: req.user._id,
    });
    res.status(201).json(exhibition);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', protect, authorize('admin', 'curator'), async (req, res) => {
  try {
    const exhibition = await Exhibition.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('location')
      .populate('curator', 'full_name email');

    if (!exhibition) return res.status(404).json({ error: 'Exhibition not found' });
    res.json(exhibition);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const exhibition = await Exhibition.findByIdAndDelete(req.params.id);
    if (!exhibition) return res.status(404).json({ error: 'Exhibition not found' });
    res.json({ message: 'Exhibition deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
