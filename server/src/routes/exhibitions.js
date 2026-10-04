import express from 'express';
import { Exhibition } from '../models/Exhibition.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) {
      if (status.includes(',')) {
        query.status = { $in: status.split(',') };
      } else {
        query.status = status;
      }
    }

    const exhibitions = await Exhibition.find(query)
      .populate('location')
      .populate('curator', 'full_name email')
      .populate({
        path: 'exhibition_artifacts.artifact_id',
        model: 'Artifact',
        populate: [
          { path: 'category' },
          { path: 'artifact_images' },
        ],
      })
      .sort('-createdAt');

    // Normalize exhibition_artifacts items so each item has artifact: artifact_id
    const normalized = exhibitions.map((exh) => {
      const obj = exh.toJSON();
      obj.exhibition_artifacts = (obj.exhibition_artifacts || []).map((ea) => ({
        ...ea,
        artifact: ea.artifact_id || ea.artifact,
      }));
      return obj;
    });

    res.json(normalized);
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
        populate: [
          { path: 'category' },
          { path: 'artist' },
          { path: 'historical_period' },
          { path: 'location' },
          { path: 'artifact_images' },
        ],
      });

    if (!exhibition) return res.status(404).json({ error: 'Exhibition not found' });

    const obj = exhibition.toJSON();
    obj.exhibition_artifacts = (obj.exhibition_artifacts || []).map((ea) => ({
      ...ea,
      artifact: ea.artifact_id || ea.artifact,
    }));

    res.json(obj);
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

// POST /api/exhibitions/:id/artifacts - add artifact to exhibition
router.post('/:id/artifacts', protect, authorize('admin', 'curator'), async (req, res) => {
  try {
    const { artifact_id, display_order = 0, notes = '' } = req.body;
    const exhibition = await Exhibition.findById(req.params.id);
    if (!exhibition) return res.status(404).json({ error: 'Exhibition not found' });

    const existingIndex = exhibition.exhibition_artifacts.findIndex(
      (ea) => ea.artifact_id.toString() === artifact_id.toString()
    );
    if (existingIndex > -1) {
      return res.status(400).json({ error: 'Artifact already in exhibition' });
    }

    exhibition.exhibition_artifacts.push({
      artifact_id,
      display_order,
      notes,
    });
    await exhibition.save();

    res.status(201).json({ message: 'Artifact added to exhibition' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/exhibitions/:id/artifacts/:artifactId - remove artifact from exhibition
router.delete('/:id/artifacts/:artifactId', protect, authorize('admin', 'curator'), async (req, res) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id);
    if (!exhibition) return res.status(404).json({ error: 'Exhibition not found' });

    exhibition.exhibition_artifacts = exhibition.exhibition_artifacts.filter(
      (ea) => ea.artifact_id.toString() !== req.params.artifactId.toString()
    );
    await exhibition.save();

    res.json({ message: 'Artifact removed from exhibition' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
