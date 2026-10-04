import express from 'express';
import { ConservationRecord } from '../models/ConservationRecord.js';
import { ProvenanceRecord } from '../models/ProvenanceRecord.js';
import { Artifact } from '../models/Artifact.js';
import { Exhibition } from '../models/Exhibition.js';
import { Review } from '../models/Review.js';
import { Comment } from '../models/Comment.js';
import { User } from '../models/User.js';
import { CategoryLike } from '../models/CategoryLike.js';
import { Favorite } from '../models/Favorite.js';
import { AuditLog } from '../models/AuditLog.js';
import { Cart } from '../models/Cart.js';
import { Category } from '../models/Category.js';
import { HistoricalPeriod } from '../models/HistoricalPeriod.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public: Get conservation records for a single artifact
router.get('/conservation/artifact/:artifactId', async (req, res) => {
  try {
    const records = await ConservationRecord.find({ artifact_id: req.params.artifactId }).sort('-assessment_date');
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy / alias
router.get('/conservation/:artifactId', async (req, res) => {
  try {
    const records = await ConservationRecord.find({ artifact_id: req.params.artifactId }).sort('-assessment_date');
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public: Get provenance records for a single artifact
router.get('/provenance/artifact/:artifactId', async (req, res) => {
  try {
    const records = await ProvenanceRecord.find({ artifact_id: req.params.artifactId }).sort('start_date');
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy / alias
router.get('/provenance/:artifactId', async (req, res) => {
  try {
    const records = await ProvenanceRecord.find({ artifact_id: req.params.artifactId }).sort('start_date');
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Below routes require authentication
router.use(protect);

// GET /api/curator/dashboard-stats
router.get('/dashboard-stats', authorize('admin', 'curator'), async (req, res) => {
  try {
    const now = new Date();
    const total = await Artifact.countDocuments();
    const overdueCons = await ConservationRecord.find({
      next_inspection_date: { $lt: now.toISOString().slice(0, 10) },
    }).populate('artifact', 'name accession_number');
    const activeExhibitions = await Exhibition.countDocuments({ status: 'active' });
    const recentArtifacts = await Artifact.find().sort('-createdAt').limit(5).select('id name accession_number createdAt created_at');

    res.json({
      total,
      needConservation: overdueCons.length,
      exhibitions: activeExhibitions,
      recentArtifacts,
      attentionArtifacts: overdueCons,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/curator/admin-dashboard-stats
router.get('/admin-dashboard-stats', authorize('admin'), async (req, res) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalArtifacts,
      publicArtifacts,
      totalExhibitions,
      visitorsCount,
      curatorsCount,
      totalUsers,
      newUsersMonth,
      loginsWeek,
      totalReviews,
      pendingReviews,
      allRatings,
      reviewsMonth,
      totalComments,
      pendingComments,
      totalCatLikes,
      totalFavorites,
      activeCarts,
      allCarts,
      catList,
      periodList,
      allArtifacts,
      recentArtifacts,
      recentLogs,
      recentReviews,
      recentComments,
      allProfiles,
      allLikes,
      allExhibitions,
      overdueInspections,
    ] = await Promise.all([
      Artifact.countDocuments(),
      Artifact.countDocuments({ is_public: true }),
      Exhibition.countDocuments(),
      User.countDocuments({ role: 'visitor' }),
      User.countDocuments({ role: 'curator' }),
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: monthAgo } }),
      AuditLog.countDocuments({ action: 'login', created_at: { $gte: weekAgo } }),
      Review.countDocuments(),
      Review.countDocuments({ status: 'pending' }),
      Review.find({ status: 'published' }).select('rating'),
      Review.countDocuments({ createdAt: { $gte: monthAgo } }),
      Comment.countDocuments(),
      Comment.countDocuments({ is_approved: false }),
      CategoryLike.countDocuments(),
      Favorite.countDocuments(),
      Cart.countDocuments({ status: 'active' }),
      Cart.find().select('cart_items'),
      Category.find().select('name'),
      HistoricalPeriod.find().select('name'),
      Artifact.find().select('category_id historical_period_id condition acquisition_date'),
      Artifact.find().sort('-createdAt').limit(5).select('id name accession_number createdAt created_at'),
      AuditLog.find().sort('-created_at').limit(8).populate('user', 'full_name'),
      Review.find().sort('-createdAt').limit(5).populate('user', 'full_name email').populate('artifact', 'name accession_number'),
      Comment.find().sort('-createdAt').limit(5).populate('user', 'full_name email').populate('artifact', 'name accession_number'),
      User.find().select('createdAt role'),
      CategoryLike.find().populate('category', 'name'),
      Exhibition.find().select('status exhibition_artifacts'),
      ConservationRecord.find({ next_inspection_date: { $lt: now.toISOString().slice(0, 10) } }).select('artifact_id'),
    ]);

    const totalCartItems = allCarts.reduce((acc, c) => acc + (c.cart_items?.length || 0), 0);
    const avgRating = allRatings.length > 0
      ? Number((allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length).toFixed(2))
      : 0;

    // Artifacts on exhibition count
    const onExhSet = new Set();
    allExhibitions.forEach((e) => {
      (e.exhibition_artifacts || []).forEach((ea) => onExhSet.add(ea.artifact_id?.toString()));
    });

    const needConsSet = new Set(overdueInspections.map((c) => c.artifact_id?.toString()));

    // Distribution by category
    const catNameMap = new Map(catList.map((c) => [c._id.toString(), c.name]));
    const catCountMap = new Map();
    allArtifacts.forEach((a) => {
      if (a.category_id && catNameMap.has(a.category_id.toString())) {
        const n = catNameMap.get(a.category_id.toString());
        catCountMap.set(n, (catCountMap.get(n) || 0) + 1);
      }
    });
    const byCategory = Array.from(catCountMap, ([name, count]) => ({ name, count }));

    // Distribution by period
    const perNameMap = new Map(periodList.map((p) => [p._id.toString(), p.name]));
    const perCountMap = new Map();
    allArtifacts.forEach((a) => {
      if (a.historical_period_id && perNameMap.has(a.historical_period_id.toString())) {
        const n = perNameMap.get(a.historical_period_id.toString());
        perCountMap.set(n, (perCountMap.get(n) || 0) + 1);
      }
    });
    const byPeriod = Array.from(perCountMap, ([name, count]) => ({ name, count }));

    // Distribution by condition
    const condMap = new Map();
    allArtifacts.forEach((a) => {
      if (a.condition) condMap.set(a.condition, (condMap.get(a.condition) || 0) + 1);
    });
    const byCondition = Array.from(condMap, ([name, count]) => ({ name, count }));

    // Acquisition trends
    const yearMap = new Map();
    allArtifacts.forEach((a) => {
      if (a.acquisition_date) {
        const y = new Date(a.acquisition_date).getFullYear().toString();
        yearMap.set(y, (yearMap.get(y) || 0) + 1);
      }
    });
    const acquisitionTrends = Array.from(yearMap, ([year, count]) => ({ year, count })).sort((a, b) => a.year.localeCompare(b.year));

    // Exhibition stats
    const exhMap = new Map();
    allExhibitions.forEach((e) => exhMap.set(e.status, (exhMap.get(e.status) || 0) + 1));
    const exhibitionStats = Array.from(exhMap, ([name, value]) => ({ name, value }));

    // User growth
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en', { month: 'short' });
      const cumulative = allProfiles.filter((p) => new Date(p.createdAt) <= new Date(d.getFullYear(), d.getMonth() + 1, 0)).length;
      months.push({ date: label, users: cumulative });
    }

    // Category likes
    const likeMap = new Map();
    allLikes.forEach((l) => {
      const n = l.category?.name;
      if (n) likeMap.set(n, (likeMap.get(n) || 0) + 1);
    });
    const categoryLikesData = Array.from(likeMap, ([name, likes]) => ({ name, likes })).sort((a, b) => b.likes - a.likes);

    // Rating distribution
    const rMap = new Map();
    [5, 4, 3, 2, 1].forEach((r) => rMap.set(r, 0));
    allRatings.forEach((r) => rMap.set(r.rating, (rMap.get(r.rating) || 0) + 1));
    const ratingDistribution = [5, 4, 3, 2, 1].map((r) => ({
      name: `${r} Star`,
      count: rMap.get(r) || 0,
    }));

    // Most reviewed
    const reviewedReviews = await Review.find({ status: 'published' }).populate('artifact', 'name');
    const revArtifactMap = new Map();
    const rateArtifactMap = new Map();
    reviewedReviews.forEach((r) => {
      const n = r.artifact?.name;
      if (n) {
        revArtifactMap.set(n, (revArtifactMap.get(n) || 0) + 1);
        const cur = rateArtifactMap.get(n) || { total: 0, count: 0 };
        rateArtifactMap.set(n, { total: cur.total + r.rating, count: cur.count + 1 });
      }
    });
    const mostReviewed = Array.from(revArtifactMap, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    const highestRated = Array.from(rateArtifactMap, ([name, v]) => ({ name, rating: Number((v.total / v.count).toFixed(1)) })).sort((a, b) => b.rating - a.rating).slice(0, 10);

    res.json({
      stats: {
        total: totalArtifacts,
        public: publicArtifacts,
        onExhibition: onExhSet.size,
        needConservation: needConsSet.size,
        exhibitions: totalExhibitions,
        visitors: visitorsCount,
        curators: curatorsCount,
        totalUsers,
        newUsersThisMonth: newUsersMonth,
        loginsThisWeek: loginsWeek,
        totalReviews,
        pendingReviews,
        averageRating: avgRating,
        reviewsThisMonth: reviewsMonth,
        totalComments,
        pendingComments,
        totalCategoryLikes: totalCatLikes,
        totalFavorites,
        activeCarts,
        totalCartItems,
      },
      byCategory,
      byPeriod,
      byCondition,
      acquisitionTrends,
      exhibitionStats,
      recentArtifacts,
      recentActivity: recentLogs,
      recentReviews,
      recentComments,
      userGrowth: months,
      categoryLikesData,
      ratingDistribution,
      mostReviewed,
      highestRated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/curator/conservation - list all
router.get('/conservation', authorize('admin', 'curator'), async (req, res) => {
  try {
    const records = await ConservationRecord.find()
      .populate({
        path: 'artifact',
        populate: [
          { path: 'category' },
          { path: 'artifact_images' },
        ],
      })
      .sort('-assessment_date');
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/conservation', authorize('admin', 'curator'), async (req, res) => {
  try {
    const record = await ConservationRecord.create({ ...req.body, created_by: req.user._id });
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/conservation/:id', authorize('admin', 'curator'), async (req, res) => {
  try {
    const record = await ConservationRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/conservation/:id', authorize('admin', 'curator'), async (req, res) => {
  try {
    await ConservationRecord.findByIdAndDelete(req.params.id);
    res.json({ message: 'Conservation record deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/curator/provenance - list all
router.get('/provenance', authorize('admin', 'curator'), async (req, res) => {
  try {
    const records = await ProvenanceRecord.find()
      .populate({
        path: 'artifact',
        populate: [
          { path: 'category' },
          { path: 'artifact_images' },
        ],
      })
      .sort('start_date');
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/provenance', authorize('admin', 'curator'), async (req, res) => {
  try {
    const record = await ProvenanceRecord.create({ ...req.body, created_by: req.user._id });
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/provenance/:id', authorize('admin', 'curator'), async (req, res) => {
  try {
    const record = await ProvenanceRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/provenance/:id', authorize('admin', 'curator'), async (req, res) => {
  try {
    await ProvenanceRecord.findByIdAndDelete(req.params.id);
    res.json({ message: 'Provenance record deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
