import express from 'express';
import { ConservationRecord } from '../models/ConservationRecord.js';
import { ProvenanceRecord } from '../models/ProvenanceRecord.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('admin', 'curator'));

// Conservation
router.get('/conservation/:artifactId', async (req, res) => {
  try {
    const records = await ConservationRecord.find({ artifact_id: req.params.artifactId }).sort('-assessment_date');
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/conservation', async (req, res) => {
  try {
    const record = await ConservationRecord.create({ ...req.body, created_by: req.user._id });
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/conservation/:id', async (req, res) => {
  try {
    const record = await ConservationRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/conservation/:id', async (req, res) => {
  try {
    await ConservationRecord.findByIdAndDelete(req.params.id);
    res.json({ message: 'Conservation record deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Provenance
router.get('/provenance/:artifactId', async (req, res) => {
  try {
    const records = await ProvenanceRecord.find({ artifact_id: req.params.artifactId }).sort('era_or_date');
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/provenance', async (req, res) => {
  try {
    const record = await ProvenanceRecord.create({ ...req.body, created_by: req.user._id });
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/provenance/:id', async (req, res) => {
  try {
    const record = await ProvenanceRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/provenance/:id', async (req, res) => {
  try {
    await ProvenanceRecord.findByIdAndDelete(req.params.id);
    res.json({ message: 'Provenance record deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
