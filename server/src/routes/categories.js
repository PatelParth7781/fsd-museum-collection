import express from 'express';
import { Category } from '../models/Category.js';
import { CategoryLike } from '../models/CategoryLike.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort('name');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/categories/likes - all category likes with user/category id
router.get('/likes', async (req, res) => {
  try {
    const likes = await CategoryLike.find().select('category_id user_id');
    res.json(likes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/categories/likes/me - user's liked category ids
router.get('/likes/me', protect, async (req, res) => {
  try {
    const likes = await CategoryLike.find({ user_id: req.user._id }).select('category_id');
    res.json(likes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/categories/:id/like - like a category
router.post('/:id/like', protect, async (req, res) => {
  try {
    const like = await CategoryLike.findOneAndUpdate(
      { user_id: req.user._id, category_id: req.params.id },
      { user_id: req.user._id, category_id: req.params.id },
      { upsert: true, new: true }
    );
    res.status(201).json(like);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/categories/:id/like - unlike a category
router.delete('/:id/like', protect, async (req, res) => {
  try {
    await CategoryLike.findOneAndDelete({
      user_id: req.user._id,
      category_id: req.params.id,
    });
    res.json({ message: 'Category unliked' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', protect, authorize('admin', 'curator'), async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', protect, authorize('admin', 'curator'), async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
