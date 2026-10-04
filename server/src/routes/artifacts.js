import express from 'express';
import { Artifact } from '../models/Artifact.js';
import { ArtifactImage } from '../models/ArtifactImage.js';
import { ProvenanceRecord } from '../models/ProvenanceRecord.js';
import { ConservationRecord } from '../models/ConservationRecord.js';
import { Exhibition } from '../models/Exhibition.js';
import { Review } from '../models/Review.js';
import { Category } from '../models/Category.js';
import { HistoricalPeriod } from '../models/HistoricalPeriod.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Natural Language / AI Search parser
router.post('/ai-search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const q = query.toLowerCase();
    const result = { search_text: '' };

    // Categories
    const categories = await Category.find();
    for (const cat of categories) {
      if (q.includes(cat.name.toLowerCase())) {
        result.category_id = cat._id.toString();
        break;
      }
    }

    // Historical Periods
    const periods = await HistoricalPeriod.find();
    for (const per of periods) {
      if (q.includes(per.name.toLowerCase())) {
        result.period_id = per._id.toString();
        break;
      }
    }

    // Conditions
    const conditions = ['excellent', 'good', 'fair', 'poor', 'critical', 'restored'];
    for (const cond of conditions) {
      if (q.includes(cond)) {
        result.condition = cond;
        break;
      }
    }

    // Materials
    const materials = ['stone', 'sandstone', 'marble', 'bronze', 'copper', 'iron', 'gold', 'silver', 'wood', 'pottery', 'terracotta', 'textile', 'silk', 'cotton', 'paper'];
    for (const mat of materials) {
      if (q.includes(mat)) {
        result.material = mat;
        break;
      }
    }

    result.search_text = query;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check duplicate accession number
router.get('/check-accession', async (req, res) => {
  try {
    const { number, excludeId } = req.query;
    if (!number) return res.json({ isDuplicate: false });

    const query = { accession_number: number };
    if (excludeId) query._id = { $ne: excludeId };

    const existing = await Artifact.findOne(query);
    res.json({ isDuplicate: !!existing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
      material,
      location,
      search,
      q,
      sort = '-createdAt',
    } = req.query;

    const query = {};

    if (category) query.category_id = category;
    if (artist) query.artist_id = artist;
    if (period) query.historical_period_id = period;
    if (status) query.status = status;
    if (condition) query.condition = condition;
    if (location) query.current_location_id = location;
    if (material) query.material = { $regex: material, $options: 'i' };
    if (is_public !== undefined) query.is_public = is_public === 'true';

    const searchText = search || q;
    if (searchText) {
      query.$or = [
        { name: { $regex: searchText, $options: 'i' } },
        { description: { $regex: searchText, $options: 'i' } },
        { accession_number: { $regex: searchText, $options: 'i' } },
        { origin: { $regex: searchText, $options: 'i' } },
        { material: { $regex: searchText, $options: 'i' } },
      ];
    }

    let sortOption = sort;
    if (sort === 'newest') sortOption = '-createdAt';
    else if (sort === 'oldest') sortOption = 'createdAt';
    else if (sort === 'name_asc') sortOption = 'name';
    else if (sort === 'name_desc') sortOption = '-name';

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Artifact.countDocuments(query);

    const artifacts = await Artifact.find(query)
      .populate('category')
      .populate('artist')
      .populate('historical_period')
      .populate('location')
      .populate('artifact_images')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    // Calculate review summary for each artifact
    const artifactIds = artifacts.map((a) => a._id);
    const reviews = await Review.find({
      artifact_id: { $in: artifactIds },
      moderation_status: 'approved',
    });

    const reviewMap = new Map();
    reviews.forEach((r) => {
      const idStr = r.artifact_id.toString();
      if (!reviewMap.has(idStr)) {
        reviewMap.set(idStr, { count: 0, totalRating: 0 });
      }
      const cur = reviewMap.get(idStr);
      cur.count += 1;
      cur.totalRating += r.rating;
    });

    const data = artifacts.map((a) => {
      const obj = a.toJSON();
      const rev = reviewMap.get(a._id.toString());
      if (rev && rev.count > 0) {
        obj.review_summary = {
          artifact_id: a._id.toString(),
          review_count: rev.count,
          average_rating: Number((rev.totalRating / rev.count).toFixed(1)),
        };
      } else {
        obj.review_summary = {
          artifact_id: a._id.toString(),
          review_count: 0,
          average_rating: 0,
        };
      }
      return obj;
    });

    res.json({
      data,
      count: total,
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

    const obj = artifact.toJSON();

    // Attach review summary
    const reviews = await Review.find({
      artifact_id: artifact._id,
      moderation_status: 'approved',
    });
    const count = reviews.length;
    const avgRating = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
    obj.review_summary = {
      artifact_id: artifact._id.toString(),
      review_count: count,
      average_rating: Number(avgRating.toFixed(1)),
      five_star: reviews.filter((r) => r.rating === 5).length,
      four_star: reviews.filter((r) => r.rating === 4).length,
      three_star: reviews.filter((r) => r.rating === 3).length,
      two_star: reviews.filter((r) => r.rating === 2).length,
      one_star: reviews.filter((r) => r.rating === 1).length,
    };

    res.json(obj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/artifacts/:id/provenance
router.get('/:id/provenance', async (req, res) => {
  try {
    const records = await ProvenanceRecord.find({ artifact_id: req.params.id }).sort('start_date');
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/artifacts/:id/conservation
router.get('/:id/conservation', async (req, res) => {
  try {
    const records = await ConservationRecord.find({ artifact_id: req.params.id }).sort('-assessment_date');
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/artifacts/:id/exhibitions
router.get('/:id/exhibitions', async (req, res) => {
  try {
    const exhibitions = await Exhibition.find({
      'exhibition_artifacts.artifact_id': req.params.id,
    })
      .populate('location')
      .populate('curator', 'full_name email');
    res.json(exhibitions);
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

    // Also delete linked images, provenance, conservation
    await ArtifactImage.deleteMany({ artifact_id: req.params.id });
    await ProvenanceRecord.deleteMany({ artifact_id: req.params.id });
    await ConservationRecord.deleteMany({ artifact_id: req.params.id });

    res.json({ message: 'Artifact and associated records deleted' });
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

// PUT /api/artifacts/:id/images/:imageId (staff only - update caption / primary)
router.put('/:id/images/:imageId', protect, authorize('admin', 'curator'), async (req, res) => {
  try {
    const { caption, is_primary } = req.body;

    if (is_primary) {
      await ArtifactImage.updateMany(
        { artifact_id: req.params.id },
        { is_primary: false }
      );
    }

    const update = {};
    if (caption !== undefined) update.caption = caption;
    if (is_primary !== undefined) update.is_primary = is_primary;

    const image = await ArtifactImage.findOneAndUpdate(
      { _id: req.params.imageId, artifact_id: req.params.id },
      update,
      { new: true }
    );

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json(image);
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
