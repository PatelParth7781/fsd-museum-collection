import express from 'express';
import { Favorite } from '../models/Favorite.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// GET /api/favorites - get current user's favorites
router.get('/', async (req, res) => {
  try {
    const favorites = await Favorite.find({ user_id: req.user._id })
      .populate({
        path: 'artifact',
        populate: [
          { path: 'category' },
          { path: 'artist' },
          { path: 'historical_period' },
          { path: 'location' },
          { path: 'artifact_images' },
        ],
      })
      .sort('-created_at');

    res.json(favorites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/favorites/check/:artifactId
router.get('/check/:artifactId', async (req, res) => {
  try {
    const favorite = await Favorite.findOne({
      user_id: req.user._id,
      artifact_id: req.params.artifactId,
    });
    res.json({ isFavorite: !!favorite });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/favorites
router.post('/', async (req, res) => {
  try {
    const { artifact_id } = req.body;
    if (!artifact_id) {
      return res.status(400).json({ error: 'artifact_id is required' });
    }

    const favorite = await Favorite.findOneAndUpdate(
      { user_id: req.user._id, artifact_id },
      { user_id: req.user._id, artifact_id },
      { upsert: true, new: true }
    );

    res.status(201).json(favorite);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/favorites/:artifactId
router.delete('/:artifactId', async (req, res) => {
  try {
    await Favorite.findOneAndDelete({
      user_id: req.user._id,
      artifact_id: req.params.artifactId,
    });
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
