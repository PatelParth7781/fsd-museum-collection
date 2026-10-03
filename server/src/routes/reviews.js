import express from 'express';
import { Review } from '../models/Review.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/reviews/artifact/:artifactId
router.get('/artifact/:artifactId', async (req, res) => {
  try {
    const reviews = await Review.find({
      artifact_id: req.params.artifactId,
      moderation_status: 'approved',
    })
      .populate('user', 'full_name avatar_url')
      .sort('-createdAt');

    // Calculate rating summary
    const count = reviews.length;
    const avgRating = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

    res.json({
      reviews,
      summary: {
        count,
        average_rating: Number(avgRating.toFixed(1)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/reviews
router.post('/', protect, async (req, res) => {
  try {
    const { artifact_id, rating, comment } = req.body;

    if (!artifact_id || !rating) {
      return res.status(400).json({ error: 'Artifact ID and rating are required' });
    }

    const review = await Review.create({
      artifact_id,
      user_id: req.user._id,
      rating,
      comment: comment || '',
      moderation_status: 'approved',
    });

    const populated = await Review.findById(review._id).populate('user', 'full_name avatar_url');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/reviews/admin (staff only)
router.get('/admin', protect, authorize('admin', 'curator'), async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'full_name email')
      .populate('artifact_id', 'name accession_number')
      .sort('-createdAt');

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/reviews/:id/moderate (staff only)
router.put('/:id/moderate', protect, authorize('admin', 'curator'), async (req, res) => {
  try {
    const { moderation_status, is_flagged } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { moderation_status, is_flagged },
      { new: true }
    );
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/reviews/:id (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
