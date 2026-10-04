import express from 'express';
import { CartItem } from '../models/CartItem.js';
import { Cart } from '../models/Cart.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// GET /api/cart - current user's items
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

// ADMIN ROUTES

// GET /api/cart/admin - list all carts with user and items populated
router.get('/admin/list', authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const carts = await Cart.find(query)
      .populate('user', 'id full_name email role')
      .populate({
        path: 'cart_items.artifact_id',
        model: 'Artifact',
        populate: [
          { path: 'category' },
          { path: 'artifact_images' },
        ],
      })
      .sort('-createdAt');

    const mapped = carts.map((c) => {
      const obj = c.toJSON();
      obj.cart_items = (obj.cart_items || []).map((ci) => ({
        ...ci,
        artifact: ci.artifact_id || ci.artifact,
      }));
      return obj;
    });

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/cart/admin/stats
router.get('/admin/stats', authorize('admin'), async (req, res) => {
  try {
    const activeCarts = await Cart.countDocuments({ status: 'active' });
    const allCarts = await Cart.find();
    const totalCartItems = allCarts.reduce((acc, c) => acc + (c.cart_items?.length || 0), 0);

    res.json({
      activeCarts,
      totalCartItems,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cart/admin - create cart
router.post('/admin', authorize('admin'), async (req, res) => {
  try {
    const { user_id, notes, status = 'active' } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const cart = await Cart.create({
      user_id,
      notes: notes || '',
      status,
      cart_items: [],
    });

    res.status(201).json(cart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/cart/admin/:id - update cart
router.put('/admin/:id', authorize('admin'), async (req, res) => {
  try {
    const cart = await Cart.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    res.json(cart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/cart/admin/:id - delete cart
router.delete('/admin/:id', authorize('admin'), async (req, res) => {
  try {
    const cart = await Cart.findByIdAndDelete(req.params.id);
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    res.json({ message: 'Cart deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cart/admin/:id/items - add item to cart
router.post('/admin/:id/items', authorize('admin'), async (req, res) => {
  try {
    const { artifact_id, quantity = 1, notes = '' } = req.body;
    const cart = await Cart.findById(req.params.id);
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const exists = cart.cart_items.find(
      (ci) => ci.artifact_id.toString() === artifact_id.toString()
    );
    if (exists) {
      return res.status(400).json({ error: 'This artifact is already in the cart' });
    }

    cart.cart_items.push({
      artifact_id,
      quantity,
      notes,
      added_by: req.user._id,
    });
    await cart.save();

    res.status(201).json({ message: 'Item added to cart' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/cart/admin/:id/items/:itemId - remove item from cart
router.delete('/admin/:id/items/:itemId', authorize('admin'), async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.id);
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    cart.cart_items = cart.cart_items.filter(
      (ci) => ci._id.toString() !== req.params.itemId.toString()
    );
    await cart.save();

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
