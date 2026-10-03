import express from 'express';
import { Artifact } from '../models/Artifact.js';
import { ArtifactImage } from '../models/ArtifactImage.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/artifacts
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      artist,
      period,
      status,
      condition,
      is_public,
      search,
      sort = '-createdAt',
    } = req.query;

    const query = {};

    if (category) query.category_id = category;
    if (artist) query.artist_id = artist;
    if (period) query.historical_period_id = period;
    if (status) query.status = status;
    if (condition) query.condition = condition;
    if (is_public !== undefined) query.is_public = is_public === 'true';

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { accession_number: { $regex: search, $options: 'i' } },
        { origin: { $regex: search, $options: 'i' } },
        { material: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Artifact.countDocuments(query);

    const artifacts = await Artifact.find(query)
      .populate('category')
      .populate('artist')
      .populate('historical_period')
      .populate('location')
      .populate('artifact_images')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      data: artifacts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/artifacts/:id
router.get('/:id', async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id)
      .populate('category')
      .populate('artist')
      .populate('historical_period')
      .populate('location')
      .populate('artifact_images');

    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    res.json(artifact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/artifacts (staff only: admin, curator)
router.post('/', protect, authorize('admin', 'curator'), async (req, res) => {
  try {
    const artifact = await Artifact.create({
      ...req.body,
      created_by: req.user._id,
    });

    const populated = await Artifact.findById(artifact._id)
      .populate('category')
      .populate('artist')
      .populate('historical_period')
      .populate('location');

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/artifacts/:id (staff only)
router.put('/:id', protect, authorize('admin', 'curator'), async (req, res) => {
  try {
    const artifact = await Artifact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('category')
      .populate('artist')
      .populate('historical_period')
      .populate('location')
      .populate('artifact_images');

    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    res.json(artifact);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/artifacts/:id (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const artifact = await Artifact.findByIdAndDelete(req.params.id);
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    // Also delete linked images
    await ArtifactImage.deleteMany({ artifact_id: req.params.id });

    res.json({ message: 'Artifact and associated images deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/artifacts/:id/images (staff only)
router.post('/:id/images', protect, authorize('admin', 'curator'), async (req, res) => {
  try {
    const { image_url, caption, is_primary } = req.body;

    if (!image_url) {
      return res.status(400).json({ error: 'image_url is required' });
    }

    if (is_primary) {
      await ArtifactImage.updateMany(
        { artifact_id: req.params.id },
        { is_primary: false }
      );
    }

    const image = await ArtifactImage.create({
      artifact_id: req.params.id,
      image_url,
      caption: caption || '',
      is_primary: !!is_primary,
      uploaded_by: req.user._id,
    });

    res.status(201).json(image);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/artifacts/:id/images/:imageId (staff only)
router.delete('/:id/images/:imageId', protect, authorize('admin', 'curator'), async (req, res) => {
  try {
    const image = await ArtifactImage.findOneAndDelete({
      _id: req.params.imageId,
      artifact_id: req.params.id,
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json({ message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
