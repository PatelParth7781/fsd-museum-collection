import express from 'express';
import { CartItem } from '../models/CartItem.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// GET /api/cart
router.get('/', async (req, res) => {
  try {
    const items = await CartItem.find({ user_id: req.user._id })
      .populate({
        path: 'artifact_id',
        model: 'Artifact',
        populate: [
          { path: 'category' },
          { path: 'artist' },
          { path: 'historical_period' },
          { path: 'artifact_images' },
        ],
      })
      .sort('-added_at');

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cart
router.post('/', async (req, res) => {
  try {
    const { artifact_id } = req.body;
    if (!artifact_id) {
      return res.status(400).json({ error: 'Artifact ID is required' });
    }

    const item = await CartItem.findOneAndUpdate(
      { user_id: req.user._id, artifact_id },
      { user_id: req.user._id, artifact_id, added_at: new Date() },
      { upsert: true, new: true }
    );

    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/cart/:artifactId
router.delete('/:artifactId', async (req, res) => {
  try {
    await CartItem.findOneAndDelete({
      user_id: req.user._id,
      artifact_id: req.params.artifactId,
    });
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/cart (clear all)
router.delete('/', async (req, res) => {
  try {
    await CartItem.deleteMany({ user_id: req.user._id });
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
