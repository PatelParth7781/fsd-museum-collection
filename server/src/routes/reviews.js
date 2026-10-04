import express from 'express';
import { Review } from '../models/Review.js';
import { Comment } from '../models/Comment.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/reviews/artifact/:artifactId
router.get('/artifact/:artifactId', async (req, res) => {
  try {
    const { page = 1, limit = 8, sort = 'recent' } = req.query;
    const query = {
      artifact_id: req.params.artifactId,
      moderation_status: 'approved',
    };

    let sortOption = '-createdAt';
    if (sort === 'highest') sortOption = '-rating -createdAt';
    else if (sort === 'lowest') sortOption = 'rating -createdAt';

    const allApproved = await Review.find(query);
    const count = allApproved.length;
    const avgRating = count > 0 ? allApproved.reduce((sum, r) => sum + r.rating, 0) / count : 0;

    const five_star = allApproved.filter((r) => r.rating === 5).length;
    const four_star = allApproved.filter((r) => r.rating === 4).length;
    const three_star = allApproved.filter((r) => r.rating === 3).length;
    const two_star = allApproved.filter((r) => r.rating === 2).length;
    const one_star = allApproved.filter((r) => r.rating === 1).length;

    const skip = (Number(page) - 1) * Number(limit);
    const reviews = await Review.find(query)
      .populate('user', 'id full_name email avatar_url')
      .populate('artifact', 'id name accession_number')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      reviews,
      data: reviews,
      total: count,
      count,
      summary: {
        count,
        review_count: count,
        average_rating: Number(avgRating.toFixed(1)),
        five_star,
        four_star,
        three_star,
        two_star,
        one_star,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reviews/artifact/:artifactId/mine
router.get('/artifact/:artifactId/mine', protect, async (req, res) => {
  try {
    const review = await Review.findOne({
      artifact_id: req.params.artifactId,
      user_id: req.user._id,
    })
      .populate('user', 'id full_name email avatar_url')
      .populate('artifact', 'id name accession_number');
    res.json(review || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/reviews
router.post('/', protect, async (req, res) => {
  try {
    const { artifact_id, rating, comment, body, title } = req.body;

    if (!artifact_id || !rating) {
      return res.status(400).json({ error: 'Artifact ID and rating are required' });
    }

    const review = await Review.create({
      artifact_id,
      user_id: req.user._id,
      rating,
      title: title || '',
      comment: body || comment || '',
      body: body || comment || '',
      moderation_status: 'approved',
      status: 'published',
    });

    const populated = await Review.findById(review._id)
      .populate('user', 'id full_name email avatar_url')
      .populate('artifact', 'id name accession_number');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/reviews/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    // Allow author or admin
    if (review.user_id.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'curator') {
      return res.status(403).json({ error: 'Not authorized to edit this review' });
    }

    const { rating, title, body, comment, status, moderation_status } = req.body;
    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (body !== undefined) {
      review.body = body;
      review.comment = body;
    } else if (comment !== undefined) {
      review.comment = comment;
      review.body = comment;
    }
    if (status !== undefined) review.status = status;
    if (moderation_status !== undefined) review.moderation_status = moderation_status;

    await review.save();
    const populated = await Review.findById(review._id)
      .populate('user', 'id full_name email avatar_url')
      .populate('artifact', 'id name accession_number');
    res.json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/reviews/admin (staff only)
router.get('/admin', protect, authorize('admin', 'curator'), async (req, res) => {
  try {
    const { status, rating } = req.query;
    const query = {};
    if (status) {
      query.$or = [{ status }, { moderation_status: status === 'published' ? 'approved' : status === 'hidden' ? 'rejected' : status }];
    }
    if (rating) query.rating = Number(rating);

    const reviews = await Review.find(query)
      .populate('user', 'id full_name email')
      .populate({
        path: 'artifact_id',
        select: 'name accession_number',
      })
      .sort('-createdAt');

    const mapped = reviews.map((r) => {
      const obj = r.toJSON();
      obj.artifact = obj.artifact || obj.artifact_id;
      return obj;
    });

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/reviews/:id/moderate (staff only)
router.put('/:id/moderate', protect, authorize('admin', 'curator'), async (req, res) => {
  try {
    const { moderation_status, is_flagged, status } = req.body;
    const update = {};
    if (moderation_status) update.moderation_status = moderation_status;
    if (status) {
      update.status = status;
      update.moderation_status = status === 'published' ? 'approved' : status === 'hidden' ? 'rejected' : 'pending';
    }
    if (typeof is_flagged === 'boolean') update.is_flagged = is_flagged;

    const review = await Review.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/reviews/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    if (review.user_id.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'curator') {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Comments Endpoints
// GET /api/reviews/artifact/:artifactId/comments
router.get('/artifact/:artifactId/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ artifact_id: req.params.artifactId })
      .populate('user', 'id full_name email avatar_url')
      .populate('artifact', 'id name accession_number')
      .sort('-createdAt');
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/reviews/artifact/:artifactId/comments
router.post('/artifact/:artifactId/comments', protect, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Comment body is required' });
    }

    const comment = await Comment.create({
      artifact_id: req.params.artifactId,
      user_id: req.user._id,
      body: body.trim(),
      is_approved: true,
      status: 'published',
    });

    const populated = await Comment.findById(comment._id)
      .populate('user', 'id full_name email avatar_url')
      .populate('artifact', 'id name accession_number');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/reviews/comments/:id
router.delete('/comments/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    if (comment.user_id.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'curator') {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
